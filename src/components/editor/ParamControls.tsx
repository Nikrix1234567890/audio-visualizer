"use client";

import type { ParamDef, ParamValue } from "../../../remotion/scene/definitions";
import { ColorRow } from "@/components/ui/ColorRow";
import { SliderRow } from "@/components/ui/SliderRow";
import { ToggleRow } from "@/components/ui/ToggleRow";

/**
 * Renders the right control for every parameter in `defs`. The sidebar is
 * built from the definitions in remotion/scene/definitions.ts, so a new
 * element type or parameter needs no UI code of its own.
 */
export function ParamControls({
  defs,
  values,
  onChange,
}: {
  defs: ParamDef[];
  values: Record<string, ParamValue>;
  onChange: (key: string, value: ParamValue) => void;
}) {
  return (
    <>
      {defs.map((def) => {
        if (def.kind === "number") {
          return (
            <SliderRow
              key={def.key}
              label={def.label}
              value={Number(values[def.key])}
              min={def.min}
              max={def.max}
              step={def.step}
              unit={def.unit}
              onChange={(v) => onChange(def.key, v)}
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
