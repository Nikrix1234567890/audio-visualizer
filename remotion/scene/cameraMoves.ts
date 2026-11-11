// Camera moves: ready-made camera animations. A move is nothing special -
// applying one just writes a few keyframes onto camera settings, starting
// at a given second, which can then be edited like any other keyframes.

import {
  CAMERA_PARAMS,
  type CameraSettings,
  type Keyframes,
  type SceneDocument,
} from "./definitions";
import { baseValue, withKeyframe, withKeyframes } from "./keyframes";

type CameraKey = keyof CameraSettings;

/** One stop of a move: where in the move (0..1) and what the value is there. */
type Stop = { at: number; value: (start: number) => number };

export type CameraMove = {
  id: string;
  label: string;
  description: string;
  /** Per camera setting, the values it passes through (after its starting value). */
  tracks: Partial<Record<CameraKey, Stop[]>>;
};

export const CAMERA_MOVES: CameraMove[] = [
  {
    id: "pushIn",
    label: "Push in",
    description: "Glides towards the scene.",
    tracks: { distance: [{ at: 1, value: (v) => v * 0.55 }] },
  },
  {
    id: "pullOut",
    label: "Pull out",
    description: "Glides away and reveals the scene.",
    tracks: { distance: [{ at: 1, value: (v) => v * 1.8 }] },
  },
  {
    id: "craneUp",
    label: "Crane up",
    description: "Rises above the scene.",
    tracks: { height: [{ at: 1, value: (v) => v + 6 }] },
  },
  {
    id: "craneDown",
    label: "Crane down",
    description: "Sinks to eye level.",
    tracks: { height: [{ at: 1, value: (v) => v - 6 }] },
  },
  {
    id: "zoomPunch",
    label: "Zoom punch",
    description: "Snaps in and eases back out.",
    tracks: {
      fov: [
        { at: 0.15, value: (v) => v - 18 },
        { at: 1, value: (v) => v },
      ],
    },
  },
  {
    id: "dollyZoom",
    label: "Dolly zoom",
    description: "Moves back while zooming in - the background rushes up.",
    tracks: {
      distance: [{ at: 1, value: (v) => v * 1.9 }],
      fov: [{ at: 1, value: (v) => v * 0.55 }],
    },
  },
  {
    id: "shakeHit",
    label: "Impact",
    description: "A burst of bass shake that dies away.",
    tracks: {
      shake: [
        { at: 0.1, value: () => 1.2 },
        { at: 1, value: (v) => v },
      ],
    },
  },
];

const roundTime = (seconds: number) => Math.round(seconds * 1000) / 1000;

/**
 * The scene with a camera move written into its camera keyframes, running
 * from second `start` for `duration` seconds. Each setting the move touches
 * starts from the value it has at that moment, so moves chain naturally.
 */
export function applyCameraMove(
  scene: SceneDocument,
  move: CameraMove,
  start: number,
  duration: number,
): SceneDocument {
  let keyframes: Keyframes = scene.cameraKeyframes ?? {};

  for (const [key, stops] of Object.entries(move.tracks) as [CameraKey, Stop[]][]) {
    const def = CAMERA_PARAMS.find((d) => d.key === key);
    if (!def || def.kind !== "number") continue;
    const clamp = (value: number) => Math.min(def.max, Math.max(def.min, value));

    const from = baseValue(scene.camera[key], key, keyframes, start);
    // Pin the value where the move begins, so nothing before it changes.
    let keys = withKeyframe(keyframes[key] ?? [], roundTime(start), from);
    for (const stop of stops) {
      keys = withKeyframe(
        keys,
        roundTime(start + stop.at * duration),
        clamp(Math.round(stop.value(from) * 100) / 100),
      );
    }
    // Moves ease in and out.
    const end = start + duration;
    keys = keys.map((k) =>
      k.t >= start - 1e-6 && k.t <= end + 1e-6 ? { ...k, ease: "smooth" as const } : k,
    );
    keyframes = withKeyframes(keyframes, key, keys);
  }

  return { ...scene, cameraKeyframes: keyframes };
}
