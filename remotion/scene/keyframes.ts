// Keyframes: a value that changes over the course of the track.
//
// A keyframed parameter has a list of markers, each "at second t the value
// is v". Between two markers the value moves from one to the other; before
// the first and after the last it stays put. An audio binding, if there is
// one, is added on top (see ./bindings.ts).
//
// Also here: the tempo swing, which bends an element's own clock so its
// motion slows down and speeds up again.
//
// Pure functions of time - the same second always gives the same value, in
// the preview and in the render.

import { getBeatClock, type TrackAnalysis } from "../audio/analysis";
import type {
  Keyframe,
  KeyframeEase,
  Keyframes,
  SceneElement,
  Tempo,
  Vec3,
} from "./definitions";

/** Markers closer together than this count as the same moment (half a frame at 60 fps). */
const SAME_MOMENT = 1 / 120;

export const KEYFRAME_EASES: { id: KeyframeEase; label: string }[] = [
  { id: "linear", label: "Linear" },
  { id: "smooth", label: "Smooth" },
  { id: "hold", label: "Hold" },
];

/** The value at second `t`. `keys` must be sorted by time and not empty. */
export function keyframeValue(keys: Keyframe[], t: number): number {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (t <= first.t) return first.v;
  if (t >= last.t) return last.v;

  let i = 0;
  while (keys[i + 1].t <= t) i++;
  const from = keys[i];
  const to = keys[i + 1];
  if (from.ease === "hold") return from.v;

  let progress = (t - from.t) / (to.t - from.t);
  // Smooth: leaves and arrives gently instead of at a constant speed.
  if (from.ease === "smooth") progress = progress * progress * (3 - 2 * progress);
  return from.v + (to.v - from.v) * progress;
}

/** The value of `key` right now: keyframed if it has markers, else the plain setting. */
export function baseValue(
  plain: number,
  key: string,
  keyframes: Keyframes | undefined,
  time: number,
): number {
  const keys = keyframes?.[key];
  return keys && keys.length > 0 ? keyframeValue(keys, time) : plain;
}

/** Index of the marker at second `t`, or -1. */
export function keyframeIndexAt(keys: Keyframe[], t: number): number {
  return keys.findIndex((key) => Math.abs(key.t - t) < SAME_MOMENT);
}

/** `keys` with the value at second `t` set - moving the marker there, or adding one. */
export function withKeyframe(keys: Keyframe[], t: number, v: number): Keyframe[] {
  const index = keyframeIndexAt(keys, t);
  if (index >= 0) {
    return keys.map((key, i) => (i === index ? { ...key, v } : key));
  }
  // A new marker takes over the easing of the stretch it lands in.
  const before = [...keys].reverse().find((key) => key.t < t);
  const added: Keyframe = { t, v, ease: before?.ease ?? "smooth" };
  return [...keys, added].sort((a, b) => a.t - b.t);
}

export function withoutKeyframe(keys: Keyframe[], t: number): Keyframe[] {
  const index = keyframeIndexAt(keys, t);
  return index < 0 ? keys : keys.filter((_, i) => i !== index);
}

/** A copy of `keyframes` with one target set, or removed when `keys` is empty or null. */
export function withKeyframes(
  keyframes: Keyframes | undefined,
  key: string,
  keys: Keyframe[] | null,
): Keyframes {
  const next = { ...keyframes };
  if (keys && keys.length > 0) next[key] = keys;
  else delete next[key];
  return next;
}

/** Every marker at second `from` moved to second `to`, in all targets. */
export function moveKeyframes(
  keyframes: Keyframes | undefined,
  from: number,
  to: number,
): Keyframes {
  const next: Keyframes = {};
  for (const [key, keys] of Object.entries(keyframes ?? {})) {
    const index = keyframeIndexAt(keys, from);
    if (index < 0) {
      next[key] = keys;
      continue;
    }
    const moved = { ...keys[index], t: to };
    // Landing on another marker replaces it.
    next[key] = [
      ...keys.filter((k, i) => i !== index && Math.abs(k.t - to) >= SAME_MOMENT),
      moved,
    ].sort((a, b) => a.t - b.t);
  }
  return next;
}

/** The distinct moments at which any target has a marker, in order. */
export function keyframeTimes(keyframes: Keyframes | undefined): number[] {
  const times: number[] = [];
  for (const keys of Object.values(keyframes ?? {})) {
    for (const key of keys) {
      if (!times.some((t) => Math.abs(t - key.t) < SAME_MOMENT)) times.push(key.t);
    }
  }
  return times.sort((a, b) => a - b);
}

/**
 * The element's own clock under a tempo swing: it runs faster, then slower,
 * then faster again, in a smooth wave - and never drifts away from the real
 * time by more than a fraction of one wave.
 *
 * With `amount` 0.6 the motion swings between 160 % and 40 % of its normal
 * speed; with 1 it comes to a brief standstill at the slowest point.
 *
 * In "beat" mode the swing follows the track instead: a surge on every
 * beat, slow motion until the next.
 */
export function warpTime(
  time: number,
  tempo: Tempo | undefined,
  analysis?: TrackAnalysis,
): number {
  if (!tempo || tempo.amount <= 0) return time;
  if (tempo.mode === "beat") {
    // Blend real time with the beat clock: at 1 the element moves only as
    // far as the beats push it.
    if (!analysis) return time;
    return time + tempo.amount * (getBeatClock(analysis, time) - time);
  }
  const wave = (2 * Math.PI) / tempo.period;
  return time + (tempo.amount / wave) * Math.sin(time * wave);
}

type TransformPatch = Partial<Pick<SceneElement, "position" | "rotation" | "scale">>;

/**
 * An element with new transform values, as dragged in the picture at second
 * `time`. A value that is keyframed gets a keyframe at that moment; a value
 * that is not is simply set.
 */
export function withTransform(
  element: SceneElement,
  patch: TransformPatch,
  time: number,
): SceneElement {
  let keyframes = element.keyframes;
  const next: SceneElement = { ...element };

  /** Returns true if the value went into a keyframe. */
  const intoKeyframe = (target: string, value: number): boolean => {
    const keys = keyframes?.[target];
    if (!keys || keys.length === 0) return false;
    // The picture reports every axis on every drag; leave the untouched ones alone.
    if (Math.abs(keyframeValue(keys, time) - value) > 1e-6) {
      keyframes = withKeyframes(keyframes, target, withKeyframe(keys, time, value));
    }
    return true;
  };

  for (const axisKey of ["position", "rotation"] as const) {
    const values = patch[axisKey];
    if (!values) continue;
    const plain: Vec3 = [...element[axisKey]];
    values.forEach((value, i) => {
      if (!intoKeyframe(`${axisKey}.${i}`, value)) plain[i] = value;
    });
    next[axisKey] = plain;
  }
  if (patch.scale !== undefined && !intoKeyframe("scale", patch.scale)) {
    next.scale = patch.scale;
  }

  next.keyframes = keyframes;
  return next;
}
