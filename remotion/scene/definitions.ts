// The scene document: what the user builds in the editor and what gets
// rendered. A scene is a list of elements (each with a type, a transform and
// its own parameters) plus a few scene-wide settings (camera, look).
//
// This file is pure data - no React, no three.js - so the editor UI, the
// Remotion composition and the server-side render route can all import it.
// The matching React components live in ./elements and are wired up in
// ./SceneRenderer.tsx.

export type Vec3 = [number, number, number];
export type ParamValue = number | string | boolean;
export type Params = Record<string, ParamValue>;

export type NumberParamDef = {
  kind: "number";
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  /** Set to false for values that must not react to audio (counts, speeds). */
  modulate?: false;
};

export type ParamDef =
  | NumberParamDef
  | { kind: "toggle"; key: string; label: string }
  | { kind: "color"; key: string; label: string };

export const ELEMENT_TYPES = [
  "barRing",
  "sphereSwarm",
  "terrainLines",
  "core",
  "glowDisc",
  "sun",
  "gridFloor",
  "stars",
] as const;

export type ElementType = (typeof ELEMENT_TYPES)[number];

export type ElementDef = {
  type: ElementType;
  label: string;
  /** One short line for the "add element" menu. */
  description: string;
  defaults: Params;
  params: ParamDef[];
};

/** The audio signals a parameter can react to, each 0..1. */
export type AudioSource = "bass" | "mid" | "treble" | "level" | "beat";

/** "Add `amount` x signal to this value" - see ./bindings.ts. */
export type Binding = { source: AudioSource; amount: number };

/** Bindings by target: a parameter key, or "position.0" / "rotation.1" / "scale". */
export type Bindings = Record<string, Binding>;

export type SceneElement = {
  id: string;
  type: ElementType;
  name: string;
  visible: boolean;
  position: Vec3;
  /** Euler angles in degrees. */
  rotation: Vec3;
  scale: number;
  params: Params;
  bindings: Bindings;
};

export type CameraSettings = {
  /** Distance from the scene centre, which the camera always looks at. */
  distance: number;
  height: number;
  /** Speed of the circular flight around the centre (radians per second). */
  orbit: number;
  /** How far the camera drifts sideways / up and down while it moves. */
  sway: number;
  bob: number;
  /** Speed of the sway and bob movement (radians per second). */
  drift: number;
  fov: number;
};

export type LookSettings = {
  background: string;
  fog: boolean;
  fogNear: number;
  fogFar: number;
  bloom: number;
  vignette: number;
};

export type SceneDocument = {
  version: 1;
  camera: CameraSettings;
  cameraBindings: Bindings;
  look: LookSettings;
  lookBindings: Bindings;
  elements: SceneElement[];
};

const hueStart: ParamDef = { kind: "number", key: "hueStart", label: "Hue start", min: 0, max: 360, step: 1, unit: "°" };
const hueEnd: ParamDef = { kind: "number", key: "hueEnd", label: "Hue end", min: 0, max: 720, step: 1, unit: "°" };
const hue: ParamDef = { kind: "number", key: "hue", label: "Hue", min: 0, max: 360, step: 1, unit: "°" };

export const ELEMENT_DEFS: Record<ElementType, ElementDef> = {
  barRing: {
    type: "barRing",
    label: "Bar Ring",
    description: "A ring of bars, one per frequency band.",
    defaults: { count: 64, radius: 4, barWidth: 0.3, height: 4.5, hueStart: 200, hueEnd: 500, glow: 1, spin: 0.05 },
    params: [
      { kind: "number", key: "count", label: "Bars", min: 8, max: 256, step: 1, modulate: false },
      { kind: "number", key: "radius", label: "Radius", min: 0.5, max: 12, step: 0.1 },
      { kind: "number", key: "barWidth", label: "Bar width", min: 0.05, max: 1.5, step: 0.01 },
      { kind: "number", key: "height", label: "Height", min: 0, max: 12, step: 0.1 },
      hueStart,
      hueEnd,
      { kind: "number", key: "glow", label: "Glow", min: 0, max: 3, step: 0.05 },
      { kind: "number", key: "spin", label: "Spin", min: -2, max: 2, step: 0.01, modulate: false },
    ],
  },
  sphereSwarm: {
    type: "sphereSwarm",
    label: "Sphere Swarm",
    description: "Particles on a sphere, pushed outward by the spectrum.",
    defaults: { count: 64, radius: 4, size: 0.3, push: 6.3, hueStart: 200, hueEnd: 500, glow: 1, wobble: 1, thread: true },
    params: [
      { kind: "number", key: "count", label: "Particles", min: 8, max: 256, step: 1, modulate: false },
      { kind: "number", key: "radius", label: "Radius", min: 0.5, max: 12, step: 0.1 },
      { kind: "number", key: "size", label: "Particle size", min: 0.05, max: 1.5, step: 0.01 },
      { kind: "number", key: "push", label: "Push", min: 0, max: 15, step: 0.1 },
      hueStart,
      hueEnd,
      { kind: "number", key: "glow", label: "Glow", min: 0, max: 3, step: 0.05 },
      { kind: "number", key: "wobble", label: "Wobble", min: 0, max: 3, step: 0.05 },
      { kind: "toggle", key: "thread", label: "Connecting thread" },
    ],
  },
  terrainLines: {
    type: "terrainLines",
    label: "Terrain Lines",
    description: "Rows of spectrum lines receding into the distance.",
    defaults: { rows: 14, points: 64, width: 18, spacing: 2.8, height: 3.15, delay: 0.1, lineWidth: 2.5, hueStart: 200, hueEnd: 500 },
    params: [
      { kind: "number", key: "rows", label: "Rows", min: 2, max: 40, step: 1, modulate: false },
      { kind: "number", key: "points", label: "Points per row", min: 8, max: 256, step: 1, modulate: false },
      { kind: "number", key: "width", label: "Width", min: 2, max: 60, step: 0.5 },
      { kind: "number", key: "spacing", label: "Row spacing", min: 0.2, max: 10, step: 0.1 },
      { kind: "number", key: "height", label: "Height", min: 0, max: 15, step: 0.05 },
      { kind: "number", key: "delay", label: "Row delay", min: 0, max: 0.5, step: 0.01, unit: "s", modulate: false },
      { kind: "number", key: "lineWidth", label: "Line width", min: 0.5, max: 8, step: 0.1 },
      hueStart,
      hueEnd,
    ],
  },
  core: {
    type: "core",
    label: "Glowing Core",
    description: "A bright sphere that pulses with bass and beat and lights its surroundings.",
    defaults: { radius: 1.4, hue: 350, pulse: 1, light: 3 },
    params: [
      { kind: "number", key: "radius", label: "Radius", min: 0.1, max: 10, step: 0.05 },
      hue,
      { kind: "number", key: "pulse", label: "Pulse", min: 0, max: 3, step: 0.05 },
      { kind: "number", key: "light", label: "Light", min: 0, max: 10, step: 0.1 },
    ],
  },
  glowDisc: {
    type: "glowDisc",
    label: "Glow Disc",
    description: "A flat disc of light on the floor that flashes on the beat.",
    defaults: { radius: 3.6, hue: 350, opacity: 0.05, pulse: 1 },
    params: [
      { kind: "number", key: "radius", label: "Radius", min: 0.5, max: 20, step: 0.1 },
      hue,
      { kind: "number", key: "opacity", label: "Base opacity", min: 0, max: 1, step: 0.01 },
      { kind: "number", key: "pulse", label: "Pulse", min: 0, max: 3, step: 0.05 },
    ],
  },
  sun: {
    type: "sun",
    label: "Sun",
    description: "A glowing disc for the horizon; ignores fog.",
    defaults: { radius: 8.8, hue: 200, pulse: 1 },
    params: [
      { kind: "number", key: "radius", label: "Radius", min: 0.5, max: 40, step: 0.1 },
      hue,
      { kind: "number", key: "pulse", label: "Pulse", min: 0, max: 5, step: 0.05 },
    ],
  },
  gridFloor: {
    type: "gridFloor",
    label: "Grid Floor",
    description: "An endless glowing grid that fades into the distance.",
    defaults: { cell: 1, section: 4, fade: 36, hue: 24 },
    params: [
      { kind: "number", key: "cell", label: "Cell size", min: 0.2, max: 5, step: 0.05 },
      { kind: "number", key: "section", label: "Section size", min: 1, max: 20, step: 0.5 },
      { kind: "number", key: "fade", label: "Fade distance", min: 5, max: 100, step: 1 },
      hue,
    ],
  },
  stars: {
    type: "stars",
    label: "Stars",
    description: "A starfield surrounding the scene.",
    defaults: { count: 2000, spread: 120, depth: 40, size: 2.4 },
    params: [
      { kind: "number", key: "count", label: "Stars", min: 100, max: 8000, step: 100, modulate: false },
      { kind: "number", key: "spread", label: "Spread", min: 20, max: 300, step: 5 },
      { kind: "number", key: "depth", label: "Depth", min: 5, max: 150, step: 5 },
      { kind: "number", key: "size", label: "Star size", min: 0.5, max: 10, step: 0.1 },
    ],
  },
};

/** Limits for the transform every element has. */
export const TRANSFORM_LIMITS = {
  position: { min: -60, max: 60, step: 0.1 },
  rotation: { min: -180, max: 180, step: 1 },
  scale: { min: 0.1, max: 5, step: 0.05 },
};

export const CAMERA_PARAMS: ParamDef[] = [
  { kind: "number", key: "distance", label: "Distance", min: 1, max: 80, step: 0.1 },
  { kind: "number", key: "height", label: "Height", min: -30, max: 40, step: 0.1 },
  { kind: "number", key: "orbit", label: "Orbit speed", min: -2, max: 2, step: 0.01, modulate: false },
  { kind: "number", key: "sway", label: "Sway", min: 0, max: 20, step: 0.1 },
  { kind: "number", key: "bob", label: "Bob", min: 0, max: 20, step: 0.1 },
  { kind: "number", key: "drift", label: "Drift speed", min: 0, max: 2, step: 0.005, modulate: false },
  { kind: "number", key: "fov", label: "Field of view", min: 15, max: 110, step: 1, unit: "°" },
];

export const LOOK_PARAMS: ParamDef[] = [
  { kind: "color", key: "background", label: "Background" },
  { kind: "number", key: "bloom", label: "Bloom", min: 0, max: 4, step: 0.05 },
  { kind: "number", key: "vignette", label: "Vignette", min: 0, max: 1, step: 0.01 },
  { kind: "toggle", key: "fog", label: "Fog" },
  { kind: "number", key: "fogNear", label: "Fog start", min: 0, max: 100, step: 0.5 },
  { kind: "number", key: "fogFar", label: "Fog end", min: 1, max: 200, step: 0.5 },
];

export const DEFAULT_CAMERA: CameraSettings = {
  distance: 9,
  height: 4,
  orbit: 0.25,
  sway: 0,
  bob: 0.6,
  drift: 0.175,
  fov: 50,
};

export const DEFAULT_LOOK: LookSettings = {
  background: "#05070d",
  fog: false,
  fogNear: 8,
  fogFar: 44,
  bloom: 1.4,
  vignette: 0.6,
};

/** Most elements a scene may hold - keeps previews and renders responsive. */
export const MAX_ELEMENTS = 40;

export function createElementId(): string {
  return `el_${Math.random().toString(36).slice(2, 10)}`;
}

/** A fresh element of the given type with default parameters. */
export function createElement(
  type: ElementType,
  overrides: Partial<Omit<SceneElement, "type" | "params">> & {
    params?: Params;
  } = {},
): SceneElement {
  const def = ELEMENT_DEFS[type];
  return {
    id: overrides.id ?? createElementId(),
    type,
    name: overrides.name ?? def.label,
    visible: overrides.visible ?? true,
    position: overrides.position ?? [0, 0, 0],
    rotation: overrides.rotation ?? [0, 0, 0],
    scale: overrides.scale ?? 1,
    params: { ...def.defaults, ...overrides.params },
    bindings: { ...overrides.bindings },
  };
}
