// Audio bindings: "patching" an audio signal into a parameter.
//
// A binding says: take this signal (0..1), multiply it by `amount`, and add
// it to the parameter's own value. So a radius of 4 bound to Bass with an
// amount of 2 moves between 4 (silence) and 6 (full bass). The result is
// clamped to the parameter's allowed range.
//
// A parameter can also be keyframed (see ./keyframes.ts). Then the binding
// is added to the keyframed value of that moment instead of the plain
// setting.
//
// Pure functions of (values, keyframes, bindings, audio, time) - the same
// frame always resolves to the same numbers, in the preview and in the
// render.

import type { AudioFrame } from "../audio/analysis";
import {
  TRANSFORM_LIMITS,
  type AudioSource,
  type Bindings,
  type Keyframes,
  type NumberParamDef,
  type ParamDef,
  type ParamValue,
  type SceneElement,
  type Vec3,
} from "./definitions";
import { baseValue } from "./keyframes";

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

/**
 * The parameter values for this moment: keyframes first, then every
 * binding on top.
 */
export function resolveParams<T extends Record<string, ParamValue>>(
  defs: ParamDef[],
  values: T,
  bindings: Bindings,
  audio: AudioFrame,
  keyframes?: Keyframes,
  time = 0,
): T {
  let resolved: Record<string, ParamValue> | null = null;

  for (const def of defs) {
    if (!isBindable(def)) continue;
    const isKeyframed = Boolean(keyframes?.[def.key]?.length);
    if (!isKeyframed && !bindings[def.key]) continue;
    resolved ??= { ...values };
    resolved[def.key] = modulated(
      baseValue(Number(values[def.key]), def.key, keyframes, time),
      def.key,
      def,
      bindings,
      audio,
    );
  }

  return (resolved as T | null) ?? values;
}

type Transform = { position: Vec3; rotation: Vec3; scale: number };

/**
 * Position, rotation and scale for this moment as the user set them:
 * keyframes applied, audio bindings not.
 */
export function baseTransform(element: SceneElement, time: number): Transform {
  const axis = (key: "position" | "rotation", i: number) =>
    baseValue(element[key][i], `${key}.${i}`, element.keyframes, time);
  return {
    position: [axis("position", 0), axis("position", 1), axis("position", 2)],
    rotation: [axis("rotation", 0), axis("rotation", 1), axis("rotation", 2)],
    scale: baseValue(element.scale, "scale", element.keyframes, time),
  };
}

/** Position, rotation and scale for this moment, with every binding applied. */
export function resolveTransform(
  element: SceneElement,
  audio: AudioFrame,
  time = 0,
): Transform {
  const { bindings } = element;
  const base = baseTransform(element, time);
  const axis = (key: "position" | "rotation", i: number) =>
    modulated(base[key][i], `${key}.${i}`, TRANSFORM_LIMITS[key], bindings, audio);

  return {
    position: [axis("position", 0), axis("position", 1), axis("position", 2)],
    rotation: [axis("rotation", 0), axis("rotation", 1), axis("rotation", 2)],
    scale: modulated(base.scale, "scale", TRANSFORM_LIMITS.scale, bindings, audio),
  };
}
