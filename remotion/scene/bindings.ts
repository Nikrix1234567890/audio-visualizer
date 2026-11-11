// Audio bindings: "patching" an audio signal into a parameter.
//
// A binding says: take this signal (0..1), multiply it by `amount`, and add
// it to the parameter's own value. So a radius of 4 bound to Bass with an
// amount of 2 moves between 4 (silence) and 6 (full bass). The result is
// clamped to the parameter's allowed range.
//
// Pure functions of (values, bindings, audio) - the same frame always
// resolves to the same numbers, in the preview and in the render.

import type { AudioFrame } from "../audio/analysis";
import {
  TRANSFORM_LIMITS,
  type AudioSource,
  type Bindings,
  type NumberParamDef,
  type ParamDef,
  type ParamValue,
  type SceneElement,
  type Vec3,
} from "./definitions";

export const AUDIO_SOURCES: { id: AudioSource; label: string }[] = [
  { id: "bass", label: "Bass" },
  { id: "mid", label: "Mid" },
  { id: "treble", label: "High" },
  { id: "level", label: "Level" },
  { id: "beat", label: "Beat" },
];

/** Binding keys for the transform every element has. */
export const TRANSFORM_TARGETS: Record<string, { min: number; max: number }> = {
  "position.0": TRANSFORM_LIMITS.position,
  "position.1": TRANSFORM_LIMITS.position,
  "position.2": TRANSFORM_LIMITS.position,
  "rotation.0": TRANSFORM_LIMITS.rotation,
  "rotation.1": TRANSFORM_LIMITS.rotation,
  "rotation.2": TRANSFORM_LIMITS.rotation,
  scale: TRANSFORM_LIMITS.scale,
};

/**
 * Whether a parameter can react to audio. Counts and speeds cannot: a count
 * would rebuild the element every frame, and a speed is multiplied by the
 * running time, so changing it makes the motion jump instead of speed up.
 */
export function isBindable(def: ParamDef): def is NumberParamDef {
  return def.kind === "number" && def.modulate !== false;
}

function modulated(
  base: number,
  key: string,
  limits: { min: number; max: number },
  bindings: Bindings,
  audio: AudioFrame,
): number {
  const binding = bindings[key];
  if (!binding) return base;
  const value = base + audio[binding.source] * binding.amount;
  return Math.min(limits.max, Math.max(limits.min, value));
}

/** The parameter values for this moment, with every binding applied. */
export function resolveParams<T extends Record<string, ParamValue>>(
  defs: ParamDef[],
  values: T,
  bindings: Bindings,
  audio: AudioFrame,
): T {
  let resolved: Record<string, ParamValue> | null = null;

  for (const def of defs) {
    if (!isBindable(def) || !bindings[def.key]) continue;
    resolved ??= { ...values };
    resolved[def.key] = modulated(
      Number(values[def.key]),
      def.key,
      def,
      bindings,
      audio,
    );
  }

  return (resolved as T | null) ?? values;
}

/** Position, rotation and scale for this moment, with every binding applied. */
export function resolveTransform(
  element: SceneElement,
  audio: AudioFrame,
): { position: Vec3; rotation: Vec3; scale: number } {
  const { bindings } = element;
  const axis = (key: "position" | "rotation", i: number) =>
    modulated(
      element[key][i],
      `${key}.${i}`,
      TRANSFORM_LIMITS[key],
      bindings,
      audio,
    );

  return {
    position: [axis("position", 0), axis("position", 1), axis("position", 2)],
    rotation: [axis("rotation", 0), axis("rotation", 1), axis("rotation", 2)],
    scale: modulated(
      element.scale,
      "scale",
      TRANSFORM_LIMITS.scale,
      bindings,
      audio,
    ),
  };
}
