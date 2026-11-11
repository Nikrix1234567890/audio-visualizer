"use client";

import { AUDIO_SOURCES } from "../../../remotion/scene/bindings";
import {
  MAX_KEYFRAMES,
  type Binding,
  type Keyframe,
} from "../../../remotion/scene/definitions";
import {
  KEYFRAME_EASES,
  keyframeIndexAt,
  keyframeValue,
  withKeyframe,
  withoutKeyframe,
} from "../../../remotion/scene/keyframes";
import { usePlayhead, usePlayheadTime } from "@/components/editor/Playhead";
import { SegmentedSelector } from "@/components/ui/SegmentedSelector";
import { SliderRow } from "@/components/ui/SliderRow";

/**
 * A fader that can be patched to an audio signal and animated over time.
 *
 * The round jack next to the caption plugs the parameter into the audio;
 * once patched, a strip below the fader picks the signal and how far it
 * moves the value.
 *
 * The diamond next to it switches on keyframes. From then on the fader
 * shows the value at the playhead, and moving it sets a keyframe there -
 * so: go to a moment, set the value, go to another moment, set another
 * value, and the parameter travels between them. The strip below jumps
 * between keyframes, adds or removes the one at the playhead and picks how
 * the value moves on from it.
 */
export function BindableSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  binding,
  onBindingChange,
  keyframes,
  onKeyframesChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  binding: Binding | undefined;
  onBindingChange: (binding: Binding | null) => void;
  keyframes?: Keyframe[];
  /**
   * New keyframes, or null to stop animating. With `plain`, the plain
   * setting is set in the same step (the value the fader showed when the
   * animation was switched off).
   */
  onKeyframesChange?: (keyframes: Keyframe[] | null, plain?: number) => void;
}) {
  const range = max - min;
  const isPatched = Boolean(binding);

  const togglePatch = () => {
    if (isPatched) {
      onBindingChange(null);
      return;
    }
    // Start with a clearly visible swing: a quarter of the range, on a step.
    const amount = Math.max(step, Math.round((range * 0.25) / step) * step);
    onBindingChange({ source: "bass", amount: Number(amount.toFixed(4)) });
  };

  const jack = (
    <button
      type="button"
      aria-pressed={isPatched}
      aria-label={
        isPatched ? `Stop ${label} reacting to audio` : `Make ${label} react to audio`
      }
      title={isPatched ? "Unplug from audio" : "React to audio"}
      onClick={togglePatch}
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border outline-none transition-colors hover:border-amber focus-visible:border-amber ${
        isPatched ? "border-amber bg-amber-dim shadow-glow-active" : "border-hairline"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isPatched ? "bg-amber" : "bg-hairline"}`}
      />
    </button>
  );

  const patchStrip = binding && (
    <div className="mt-1 flex flex-col gap-2 border-l border-amber-dim pl-3">
      <SegmentedSelector
        stretch
        options={AUDIO_SOURCES.map((s) => ({ value: s.id, label: s.label }))}
        value={binding.source}
        onChange={(source) => onBindingChange({ ...binding, source })}
      />
      <SliderRow
        label="Amount"
        value={binding.amount}
        min={-range}
        max={range}
        step={step}
        unit={unit}
        onChange={(amount) => onBindingChange({ ...binding, amount })}
      />
    </div>
  );

  // Not every fader can be animated (the Amount fader above, for one).
  if (!onKeyframesChange) {
    return (
      <SliderRow
        label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        unit={unit}
        onChange={onChange}
        accessory={jack}
      >
        {patchStrip}
      </SliderRow>
    );
  }

  if (!keyframes || keyframes.length === 0) {
    return (
      <StillSlider
        label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        unit={unit}
        onChange={onChange}
        jack={jack}
        onKeyframesChange={onKeyframesChange}
      >
        {patchStrip}
      </StillSlider>
    );
  }

  return (
    <AnimatedSlider
      label={label}
      min={min}
      max={max}
      step={step}
      unit={unit}
      jack={jack}
      keyframes={keyframes}
      onKeyframesChange={onKeyframesChange}
    >
      {patchStrip}
    </AnimatedSlider>
  );
}

type SharedProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  jack: React.ReactNode;
  onKeyframesChange: (keyframes: Keyframe[] | null, plain?: number) => void;
  children: React.ReactNode;
};

/** Not animated: a plain fader, plus the diamond that starts an animation. */
function StillSlider({
  value,
  onChange,
  ...shared
}: SharedProps & { value: number; onChange: (value: number) => void }) {
  const playhead = usePlayhead();
  const { label, jack, onKeyframesChange, children, ...limits } = shared;

  return (
    <SliderRow
      label={label}
      value={value}
      {...limits}
      onChange={onChange}
      accessory={
        <>
          {jack}
          <Diamond
            isLit={false}
            label={`Animate ${label} over time`}
            title="Animate over time: sets a keyframe here"
            onClick={() =>
              onKeyframesChange([{ t: roundTime(playhead.now()), v: value, ease: "smooth" }])
            }
          />
        </>
      }
    >
      {children}
    </SliderRow>
  );
}

/** Animated: follows the playhead, and moving the fader sets a keyframe. */
function AnimatedSlider({
  keyframes,
  ...shared
}: SharedProps & { keyframes: Keyframe[] }) {
  const playhead = usePlayhead();
  // Subscribing keeps the fader in step with the playhead.
  const time = usePlayheadTime();
  const { label, jack, onKeyframesChange, children, ...limits } = shared;

  const shown = keyframeValue(keyframes, time);
  const indexHere = keyframeIndexAt(keyframes, time);
  const isOnKeyframe = indexHere >= 0;
  const previous = [...keyframes].reverse().find((key) => key.t < time - 1e-3);
  const next = keyframes.find((key) => key.t > time + 1e-3);
  // The keyframe whose easing shapes the stretch the playhead is in.
  const governing = isOnKeyframe ? keyframes[indexHere] : (previous ?? keyframes[0]);
  const isFull = keyframes.length >= MAX_KEYFRAMES;

  const setHere = (v: number) => {
    const t = roundTime(playhead.now());
    if (isFull && keyframeIndexAt(keyframes, t) < 0) return;
    onKeyframesChange(withKeyframe(keyframes, t, v));
  };

  const toggleHere = () => {
    const t = roundTime(playhead.now());
    if (keyframeIndexAt(keyframes, t) < 0) {
      setHere(keyframeValue(keyframes, t));
      return;
    }
    const remaining = withoutKeyframe(keyframes, t);
    // Removing the last keyframe ends the animation at the value shown.
    if (remaining.length === 0) onKeyframesChange(null, shown);
    else onKeyframesChange(remaining);
  };

  const stepButton =
    "flex h-6 w-6 items-center justify-center rounded-md border border-hairline text-cream outline-none hover:border-amber-dim hover:text-amber focus-visible:border-amber disabled:cursor-not-allowed disabled:text-steel disabled:opacity-40 disabled:hover:border-hairline disabled:hover:text-steel";

  return (
    <SliderRow
      label={label}
      value={shown}
      {...limits}
      onChange={setHere}
      accessory={
        <>
          {jack}
          <Diamond
            isLit
            label={`Stop animating ${label}`}
            title="Stop animating: removes every keyframe, keeps this value"
            onClick={() => onKeyframesChange(null, shown)}
          />
        </>
      }
    >
      <div className="mt-1 flex flex-col gap-2 border-l border-amber-dim pl-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={stepButton}
            disabled={!previous}
            aria-label="Go to the previous keyframe"
            title="Previous keyframe"
            onClick={() => previous && playhead.seek(previous.t)}
          >
            <Chevron direction="left" />
          </button>
          <button
            type="button"
            aria-pressed={isOnKeyframe}
            disabled={!isOnKeyframe && isFull}
            title={isOnKeyframe ? "Remove the keyframe here" : "Add a keyframe here"}
            onClick={toggleHere}
            className={`flex h-6 flex-1 items-center justify-center gap-1.5 rounded-md border font-mono text-[10px] tracking-[0.06em] uppercase outline-none hover:border-amber focus-visible:border-amber disabled:opacity-40 ${
              isOnKeyframe
                ? "border-amber-dim text-amber"
                : "border-hairline text-steel hover:text-cream"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rotate-45 ${isOnKeyframe ? "bg-amber" : "border border-steel"}`}
            />
            {isOnKeyframe ? "Keyframe" : "Add keyframe"}
          </button>
          <button
            type="button"
            className={stepButton}
            disabled={!next}
            aria-label="Go to the next keyframe"
            title="Next keyframe"
            onClick={() => next && playhead.seek(next.t)}
          >
            <Chevron direction="right" />
          </button>
          <span className="w-12 shrink-0 text-right font-mono text-[10px] tracking-[0.06em] text-steel tabular-nums">
            {(isOnKeyframe ? indexHere + 1 : "–") + " / " + keyframes.length}
          </span>
        </div>
        <SegmentedSelector
          stretch
          options={KEYFRAME_EASES.map((e) => ({ value: e.id, label: e.label }))}
          value={governing.ease}
          onChange={(ease) =>
            onKeyframesChange(
              keyframes.map((key) => (key === governing ? { ...key, ease } : key)),
            )
          }
        />
      </div>
      {children}
    </SliderRow>
  );
}

/** Keyframe times are kept to the millisecond. */
const roundTime = (seconds: number) => Math.round(seconds * 1000) / 1000;

function Diamond({
  isLit,
  label,
  title,
  onClick,
}: {
  isLit: boolean;
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isLit}
      aria-label={label}
      title={title}
      onClick={onClick}
      className="group/diamond flex h-4 w-4 shrink-0 items-center justify-center outline-none"
    >
      <span
        className={`h-2.5 w-2.5 rotate-45 border transition-colors group-hover/diamond:border-amber group-focus-visible/diamond:border-amber ${
          isLit ? "border-amber bg-amber-dim shadow-glow-active" : "border-hairline"
        }`}
      />
    </button>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d={direction === "left" ? "M6.5 2L3.5 5l3 3" : "M3.5 2l3 3-3 3"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
