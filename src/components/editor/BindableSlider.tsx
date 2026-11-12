"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
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

/** The name a signal's colour goes by in the stylesheet (`data-sig`). */
export const signalName = (source: string) => (source === "treble" ? "high" : source);

/**
 * A scrub field that can be patched to an audio signal and animated over
 * time.
 *
 * The round jack right of the field plugs the parameter into the audio. Lit,
 * it has the colour of its signal, and a bar under the field's fill shows
 * how far the audio pushes the value. Clicking the jack opens a small panel
 * to pick the signal and the amount, or to unplug it.
 *
 * The diamond switches on keyframes. From then on the field shows the value
 * at the playhead, and changing it sets a keyframe there - so: go to a
 * moment, set the value, go to another moment, set another value, and the
 * parameter travels between them. The diamond is filled while a keyframe
 * sits exactly at the playhead; clicking it adds or removes that keyframe.
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
   * setting is set in the same step (the value the field showed when the
   * animation was switched off).
   */
  onKeyframesChange?: (keyframes: Keyframe[] | null, plain?: number) => void;
}) {
  const range = max - min;
  const [isPatchOpen, setIsPatchOpen] = useState(false);

  const onJack = () => {
    if (binding) {
      setIsPatchOpen(!isPatchOpen);
      return;
    }
    // Start with a clearly visible swing: a quarter of the range, on a step.
    const amount = Math.max(step, Math.round((range * 0.25) / step) * step);
    onBindingChange({ source: "bass", amount: Number(amount.toFixed(4)) });
    setIsPatchOpen(true);
  };

  const jack = (
    <button
      type="button"
      aria-expanded={binding ? isPatchOpen : undefined}
      aria-label={
        binding ? `${label} reacts to audio: change or unplug` : `Make ${label} react to audio`
      }
      title={binding ? "Reacts to audio" : "React to audio"}
      data-sig={binding ? signalName(binding.source) : undefined}
      onClick={onJack}
      className="pf-jack"
    />
  );

  const patch = (
    <Fold isOpen={Boolean(binding) && isPatchOpen}>
      {binding && (
        <div className="pf-sub">
          <div className="pf-sub__head">
            {label} reacts to
            <button
              type="button"
              className="pf-btn pf-btn--ghost pf-btn--sm"
              onClick={() => {
                onBindingChange(null);
                setIsPatchOpen(false);
              }}
            >
              Unplug
            </button>
          </div>
          <div className="pf-sub__row">
            {AUDIO_SOURCES.map((source) => (
              <button
                key={source.id}
                type="button"
                className="pf-signal"
                data-sig={signalName(source.id)}
                aria-pressed={binding.source === source.id}
                onClick={() => onBindingChange({ ...binding, source: source.id })}
              >
                {source.label}
              </button>
            ))}
          </div>
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
      )}
    </Fold>
  );

  const signal = binding ? signalName(binding.source) : undefined;
  const modulation = binding?.amount ?? 0;

  // Not every field can be animated (counts and speeds, for one).
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
        signal={signal}
        modulation={modulation}
      >
        {patch}
      </SliderRow>
    );
  }

  const shared = { label, min, max, step, unit, jack, signal, modulation, onKeyframesChange };

  if (!keyframes || keyframes.length === 0) {
    return (
      <StillSlider {...shared} value={value} onChange={onChange}>
        {patch}
      </StillSlider>
    );
  }

  return (
    <AnimatedSlider {...shared} keyframes={keyframes}>
      {patch}
    </AnimatedSlider>
  );
}

type SharedProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  jack: ReactNode;
  signal: string | undefined;
  modulation: number;
  onKeyframesChange: (keyframes: Keyframe[] | null, plain?: number) => void;
  children: ReactNode;
};

/** Not animated: a plain field, plus the diamond that starts an animation. */
function StillSlider({
  value,
  onChange,
  ...shared
}: SharedProps & { value: number; onChange: (value: number) => void }) {
  const playhead = usePlayhead();
  const { label, jack, onKeyframesChange, children, ...rest } = shared;

  return (
    <SliderRow
      label={label}
      value={value}
      {...rest}
      onChange={onChange}
      accessory={
        <>
          {jack}
          <button
            type="button"
            className="pf-key"
            aria-label={`Animate ${label} over time`}
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

/** Animated: follows the playhead, and changing the field sets a keyframe. */
function AnimatedSlider({
  keyframes,
  ...shared
}: SharedProps & { keyframes: Keyframe[] }) {
  const playhead = usePlayhead();
  // Subscribing keeps the field in step with the playhead.
  const time = usePlayheadTime();
  const [isOpen, setIsOpen] = useState(false);
  const { label, jack, onKeyframesChange, children, ...rest } = shared;

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

  return (
    <SliderRow
      label={label}
      value={shown}
      {...rest}
      onChange={setHere}
      isActive={isOnKeyframe}
      accessory={
        <>
          {jack}
          <button
            type="button"
            className="pf-key"
            data-state={isOnKeyframe ? "at" : "on"}
            aria-expanded={isOpen}
            aria-label={`${label} is animated: show its keyframes`}
            title={isOnKeyframe ? "A keyframe sits here" : "Animated over time"}
            onClick={() => setIsOpen(!isOpen)}
          />
        </>
      }
    >
      <Fold isOpen={isOpen}>
        <div className="pf-sub">
          <div className="pf-sub__row">
            <button
              type="button"
              className="pf-btn pf-btn--ghost pf-btn--icon pf-btn--sm"
              disabled={!previous}
              aria-label="Go to the previous keyframe"
              title="Previous keyframe"
              onClick={() => previous && playhead.seek(previous.t)}
            >
              <ChevronLeft className="pf-i pf-i--sm" aria-hidden />
            </button>
            <button
              type="button"
              className="pf-btn pf-btn--secondary pf-btn--sm"
              aria-pressed={isOnKeyframe}
              disabled={!isOnKeyframe && isFull}
              title={isOnKeyframe ? "Remove the keyframe here" : "Add a keyframe here"}
              onClick={toggleHere}
            >
              {isOnKeyframe ? "Remove keyframe" : "Add keyframe"}
            </button>
            <button
              type="button"
              className="pf-btn pf-btn--ghost pf-btn--icon pf-btn--sm"
              disabled={!next}
              aria-label="Go to the next keyframe"
              title="Next keyframe"
              onClick={() => next && playhead.seek(next.t)}
            >
              <ChevronRight className="pf-i pf-i--sm" aria-hidden />
            </button>
            <span className="pf-sub__count">
              {(isOnKeyframe ? indexHere + 1 : "–") + " / " + keyframes.length}
            </span>
          </div>
          <SegmentedSelector
            stretch
            label="How the value moves on from this keyframe"
            options={KEYFRAME_EASES.map((e) => ({ value: e.id, label: e.label }))}
            value={governing.ease}
            onChange={(ease) =>
              onKeyframesChange(
                keyframes.map((key) => (key === governing ? { ...key, ease } : key)),
              )
            }
          />
          <button
            type="button"
            className="pf-btn pf-btn--ghost pf-btn--sm self-start"
            title="Removes every keyframe and keeps the value shown"
            onClick={() => onKeyframesChange(null, shown)}
          >
            Stop animating
          </button>
        </div>
      </Fold>
      {children}
    </SliderRow>
  );
}

/** Keyframe times are kept to the millisecond. */
const roundTime = (seconds: number) => Math.round(seconds * 1000) / 1000;

/** Opens and closes what sits under a field with a short height animation. */
function Fold({ isOpen, children }: { isOpen: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="fold"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.3, 0.7, 0.3, 1] }}
          style={{ overflow: "hidden" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
