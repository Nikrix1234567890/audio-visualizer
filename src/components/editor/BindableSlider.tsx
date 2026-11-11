"use client";

import { AUDIO_SOURCES } from "../../../remotion/scene/bindings";
import type { Binding } from "../../../remotion/scene/definitions";
import { SegmentedSelector } from "@/components/ui/SegmentedSelector";
import { SliderRow } from "@/components/ui/SliderRow";

/**
 * A fader that can be patched to an audio signal. The small jack next to
 * the caption plugs the parameter in; once patched, a strip below the fader
 * picks the signal and how far it moves the value (in the parameter's own
 * units, negative to move it the other way).
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

  return (
    <SliderRow
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      unit={unit}
      onChange={onChange}
      accessory={
        <button
          type="button"
          aria-pressed={isPatched}
          aria-label={
            isPatched
              ? `Stop ${label} reacting to audio`
              : `Make ${label} react to audio`
          }
          title={isPatched ? "Unplug from audio" : "React to audio"}
          onClick={togglePatch}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border outline-none transition-colors hover:border-amber focus-visible:border-amber ${
            isPatched
              ? "border-amber bg-amber-dim shadow-glow-active"
              : "border-hairline"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isPatched ? "bg-amber" : "bg-hairline"
            }`}
          />
        </button>
      }
    >
      {binding && (
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
      )}
    </SliderRow>
  );
}
