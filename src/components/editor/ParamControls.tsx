"use client";

import type {
  Binding,
  Bindings,
  ParamDef,
  ParamValue,
} from "../../../remotion/scene/definitions";
import { BindableSlider } from "@/components/editor/BindableSlider";
import { ColorRow } from "@/components/ui/ColorRow";
import { ImageRow } from "@/components/ui/ImageRow";
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
}: {
  defs: ParamDef[];
  values: Record<string, ParamValue>;
  onChange: (key: string, value: ParamValue) => void;
  bindings: Bindings;
  onBindingChange: (key: string, binding: Binding | null) => void;
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
        if (def.kind === "image") {
          return (
            <ImageRow
              key={def.key}
              label={def.label}
              value={String(values[def.key] ?? "")}
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
