"use client";

import {
  MAX_LINES_LENGTH,
  MAX_TEXT_LENGTH,
  type Binding,
  type Bindings,
  type Keyframe,
  type Keyframes,
  type ParamDef,
  type ParamValue,
} from "../../../remotion/scene/definitions";
import { BindableSlider } from "@/components/editor/BindableSlider";
import { ColorRow } from "@/components/ui/ColorRow";
import { AssetRow } from "@/components/ui/AssetRow";
import { LinesRow } from "@/components/ui/LinesRow";
import { SelectRow } from "@/components/ui/SelectRow";
import { TextRow } from "@/components/ui/TextRow";
import { SliderRow } from "@/components/ui/SliderRow";
import { ToggleRow } from "@/components/ui/ToggleRow";

/**
 * Renders the right control for every parameter in `defs`. The sidebar is
 * built from the definitions in remotion/scene/definitions.ts, so a new
 * element type or parameter needs no UI code of its own. Numbers that may
 * react to audio get a fader with an audio jack.
 */
export function ParamControls({
  defs,
  values,
  onChange,
  bindings,
  onBindingChange,
  keyframes,
  onKeyframesChange,
}: {
  defs: ParamDef[];
  values: Record<string, ParamValue>;
  onChange: (key: string, value: ParamValue) => void;
  bindings: Bindings;
  onBindingChange: (key: string, binding: Binding | null) => void;
  keyframes: Keyframes | undefined;
  /** See BindableSlider: null stops the animation, `plain` sets the plain value with it. */
  onKeyframesChange: (key: string, keyframes: Keyframe[] | null, plain?: number) => void;
}) {
  return (
    <>
      {defs.map((def) => {
        if (def.kind === "number") {
          const common = {
            label: def.label,
            value: Number(values[def.key]),
            min: def.min,
            max: def.max,
            step: def.step,
            unit: def.unit,
            onChange: (v: number) => onChange(def.key, v),
          };
          // Counts and speeds cannot react to audio (see isBindable).
          return def.modulate === false ? (
            <SliderRow key={def.key} {...common} />
          ) : (
            <BindableSlider
              key={def.key}
              {...common}
              binding={bindings[def.key]}
              onBindingChange={(b) => onBindingChange(def.key, b)}
              keyframes={keyframes?.[def.key]}
              onKeyframesChange={(keys, plain) =>
                onKeyframesChange(def.key, keys, plain)
              }
            />
          );
        }
        if (def.kind === "toggle") {
          return (
            <ToggleRow
              key={def.key}
              label={def.label}
              value={Boolean(values[def.key])}
              onChange={(v) => onChange(def.key, v)}
            />
          );
        }
        if (def.kind === "image" || def.kind === "model") {
          return (
            <AssetRow
              key={def.key}
              kind={def.kind}
              label={def.label}
              value={String(values[def.key] ?? "")}
              onChange={(v) => onChange(def.key, v)}
            />
          );
        }
        if (def.kind === "lines") {
          return (
            <LinesRow
              key={def.key}
              label={def.label}
              value={String(values[def.key] ?? "")}
              maxLength={MAX_LINES_LENGTH}
              placeholder={def.placeholder}
              onChange={(v) => onChange(def.key, v)}
            />
          );
        }
        if (def.kind === "select") {
          return (
            <SelectRow
              key={def.key}
              label={def.label}
              value={String(values[def.key] ?? "")}
              options={def.options}
              onChange={(v) => onChange(def.key, v)}
            />
          );
        }
        if (def.kind === "text") {
          return (
            <TextRow
              key={def.key}
              label={def.label}
              value={String(values[def.key] ?? "")}
              maxLength={MAX_TEXT_LENGTH}
              onChange={(v) => onChange(def.key, v)}
            />
          );
        }
        return (
          <ColorRow
            key={def.key}
            label={def.label}
            value={String(values[def.key])}
            onChange={(v) => onChange(def.key, v)}
          />
        );
      })}
    </>
  );
}
