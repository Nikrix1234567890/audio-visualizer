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
  | { kind: "color"; key: string; label: string }
  /** An uploaded picture; the value is its storage key, or "" for none. */
  | { kind: "image"; key: string; label: string }
  /** An uploaded 3D model (.glb); the value is its storage key, or "". */
  | { kind: "model"; key: string; label: string }
  /** A short single line of text. */
  | { kind: "text"; key: string; label: string };

/** Longest text a text parameter may hold. */
export const MAX_TEXT_LENGTH = 120;

export const ELEMENT_TYPES = [
  "barRing",
  "sphereSwarm",
  "terrainLines",
  "core",
  "glowDisc",
  "sun",
  "gridFloor",
  "stars",
  "spectrumRing",
  "particles",
  "image",
  "backdrop",
  "model",
  "text",
  "waveSurface",
  "particleDisc",
  "tunnel",
  "helix",
  "galaxy",
  "spikeOrb",
  "rippleRings",
  "aurora",
  "fireflies",
  "digitalRain",
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
  /** How hard the camera shakes with the bass (0 = steady). */
  shake: number;
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

// Both ends go up to 720 so a gradient can cross the 360° mark the short way (see palettes.ts).
const hueStart: ParamDef = { kind: "number", key: "hueStart", label: "Hue start", min: 0, max: 720, step: 1, unit: "°" };
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
  waveSurface: {
    type: "waveSurface",
    label: "Wave Surface",
    description: "A rolling surface of thousands of glowing points that flows with the music.",
    defaults: { resolution: 170, size: 18, height: 2.4, flow: 0.4, detail: 1, pointSize: 0.2, hueStart: 26, hueEnd: 44, glow: 1, grid: true, round: true },
    params: [
      { kind: "number", key: "resolution", label: "Density", min: 40, max: 220, step: 2, modulate: false },
      { kind: "number", key: "size", label: "Size", min: 2, max: 60, step: 0.5 },
      { kind: "number", key: "height", label: "Wave height", min: 0, max: 10, step: 0.05 },
      { kind: "number", key: "flow", label: "Flow speed", min: -3, max: 3, step: 0.05, modulate: false },
      { kind: "number", key: "detail", label: "Wave detail", min: 0.2, max: 4, step: 0.05, modulate: false },
      { kind: "number", key: "pointSize", label: "Point size", min: 0.01, max: 0.5, step: 0.005 },
      hueStart,
      hueEnd,
      { kind: "number", key: "glow", label: "Glow", min: 0, max: 4, step: 0.05 },
      { kind: "toggle", key: "grid", label: "Grid lines" },
      { kind: "toggle", key: "round", label: "Round edge" },
    ],
  },
  particleDisc: {
    type: "particleDisc",
    label: "Particle Disc",
    description: "A swirling disc of glowing particles with rays, puffing up with the spectrum.",
    defaults: { count: 18000, radius: 5, height: 1.8, rays: 90, rayLength: 2.6, pointSize: 0.3, hueStart: 44, hueEnd: 24, glow: 1, swirl: 0.15, pulse: 1 },
    params: [
      { kind: "number", key: "count", label: "Particles", min: 500, max: 40000, step: 500, modulate: false },
      { kind: "number", key: "radius", label: "Radius", min: 0.5, max: 20, step: 0.1 },
      { kind: "number", key: "height", label: "Cloud height", min: 0, max: 8, step: 0.05 },
      { kind: "number", key: "rays", label: "Rays", min: 0, max: 240, step: 1, modulate: false },
      { kind: "number", key: "rayLength", label: "Ray length", min: 0, max: 12, step: 0.1 },
      { kind: "number", key: "pointSize", label: "Point size", min: 0.01, max: 0.6, step: 0.005 },
      hueStart,
      hueEnd,
      { kind: "number", key: "glow", label: "Glow", min: 0, max: 4, step: 0.05 },
      { kind: "number", key: "swirl", label: "Swirl speed", min: -3, max: 3, step: 0.05, modulate: false },
      { kind: "number", key: "pulse", label: "Pulse", min: 0, max: 4, step: 0.05 },
    ],
  },
  tunnel: {
    type: "tunnel",
    label: "Tunnel",
    description: "Rings rushing past - a square, hexagonal or round tunnel to fly through.",
    defaults: { rings: 48, sides: 4, radius: 3, spacing: 1.2, speed: 5, boost: 16, twist: 0.1, bump: 0.12, hueStart: 290, hueEnd: 190, glow: 1 },
    params: [
      { kind: "number", key: "rings", label: "Rings", min: 6, max: 120, step: 1, modulate: false },
      { kind: "number", key: "sides", label: "Sides (16+ = round)", min: 3, max: 16, step: 1, modulate: false },
      { kind: "number", key: "radius", label: "Radius", min: 0.5, max: 15, step: 0.1 },
      { kind: "number", key: "spacing", label: "Ring spacing", min: 0.3, max: 6, step: 0.1, modulate: false },
      { kind: "number", key: "speed", label: "Flight speed", min: -20, max: 20, step: 0.5, modulate: false },
      { kind: "number", key: "boost", label: "Bass surge", min: 0, max: 80, step: 1, modulate: false },
      { kind: "number", key: "twist", label: "Twist", min: -1, max: 1, step: 0.01, modulate: false },
      { kind: "number", key: "bump", label: "Spectrum bulge", min: 0, max: 2, step: 0.05 },
      hueStart,
      hueEnd,
      { kind: "number", key: "glow", label: "Glow", min: 0, max: 4, step: 0.05 },
    ],
  },
  helix: {
    type: "helix",
    label: "Helix",
    description: "Strands of particles winding around each other like DNA.",
    defaults: { count: 12000, strands: 2, length: 13, radius: 2, turns: 3, spin: 0.5, bump: 0.5, fuzz: 0.35, pointSize: 0.2, hueStart: 190, hueEnd: 310, glow: 1, rungs: true },
    params: [
      { kind: "number", key: "count", label: "Particles", min: 500, max: 40000, step: 500, modulate: false },
      { kind: "number", key: "strands", label: "Strands", min: 1, max: 6, step: 1, modulate: false },
      { kind: "number", key: "length", label: "Length", min: 2, max: 40, step: 0.5 },
      { kind: "number", key: "radius", label: "Radius", min: 0.2, max: 10, step: 0.05 },
      { kind: "number", key: "turns", label: "Turns", min: 0.5, max: 12, step: 0.1 },
      { kind: "number", key: "spin", label: "Spin", min: -4, max: 4, step: 0.05, modulate: false },
      { kind: "number", key: "bump", label: "Spectrum swell", min: 0, max: 3, step: 0.05 },
      { kind: "number", key: "fuzz", label: "Fuzz", min: 0, max: 2, step: 0.01 },
      { kind: "number", key: "pointSize", label: "Point size", min: 0.01, max: 0.6, step: 0.005 },
      hueStart,
      hueEnd,
      { kind: "number", key: "glow", label: "Glow", min: 0, max: 4, step: 0.05 },
      { kind: "toggle", key: "rungs", label: "Rungs" },
    ],
  },
  galaxy: {
    type: "galaxy",
    label: "Galaxy",
    description: "A spiral galaxy of particles with a bright core and winding arms.",
    defaults: { count: 30000, arms: 3, radius: 7, twist: 5, spread: 0.45, thickness: 0.45, swirl: 0.12, pulse: 1, pointSize: 0.2, hueStart: 400, hueEnd: 250, glow: 1 },
    params: [
      { kind: "number", key: "count", label: "Particles", min: 1000, max: 60000, step: 1000, modulate: false },
      { kind: "number", key: "arms", label: "Arms", min: 1, max: 8, step: 1, modulate: false },
      { kind: "number", key: "radius", label: "Radius", min: 1, max: 25, step: 0.1 },
      { kind: "number", key: "twist", label: "Arm winding", min: -12, max: 12, step: 0.1 },
      { kind: "number", key: "spread", label: "Arm width", min: 0, max: 2, step: 0.01 },
      { kind: "number", key: "thickness", label: "Thickness", min: 0, max: 4, step: 0.05 },
      { kind: "number", key: "swirl", label: "Swirl speed", min: -3, max: 3, step: 0.01, modulate: false },
      { kind: "number", key: "pulse", label: "Pulse", min: 0, max: 4, step: 0.05 },
      { kind: "number", key: "pointSize", label: "Point size", min: 0.01, max: 0.6, step: 0.005 },
      hueStart,
      hueEnd,
      { kind: "number", key: "glow", label: "Glow", min: 0, max: 4, step: 0.05 },
    ],
  },
  spikeOrb: {
    type: "spikeOrb",
    label: "Spike Orb",
    description: "A sphere of points that throws up moving spikes, like a magnetic liquid.",
    defaults: { count: 20000, radius: 3, spikes: 2.4, detail: 1, flow: 0.5, pointSize: 0.14, hueStart: 215, hueEnd: 320, glow: 1 },
    params: [
      { kind: "number", key: "count", label: "Points", min: 1000, max: 50000, step: 1000, modulate: false },
      { kind: "number", key: "radius", label: "Radius", min: 0.5, max: 12, step: 0.05 },
      { kind: "number", key: "spikes", label: "Spike height", min: 0, max: 8, step: 0.05 },
      { kind: "number", key: "detail", label: "Spike count", min: 0.3, max: 3, step: 0.05, modulate: false },
      { kind: "number", key: "flow", label: "Flow speed", min: -3, max: 3, step: 0.05, modulate: false },
      { kind: "number", key: "pointSize", label: "Point size", min: 0.01, max: 0.6, step: 0.005 },
      hueStart,
      hueEnd,
      { kind: "number", key: "glow", label: "Glow", min: 0, max: 4, step: 0.05 },
    ],
  },
  rippleRings: {
    type: "rippleRings",
    label: "Ripple Rings",
    description: "Concentric rings rising in waves, like ripples on water.",
    defaults: { rings: 30, radius: 8, height: 2.2, lobes: 3, flow: 0.8, hueStart: 180, hueEnd: 280, glow: 1 },
    params: [
      { kind: "number", key: "rings", label: "Rings", min: 3, max: 80, step: 1, modulate: false },
      { kind: "number", key: "radius", label: "Radius", min: 1, max: 30, step: 0.1 },
      { kind: "number", key: "height", label: "Wave height", min: 0, max: 10, step: 0.05 },
      { kind: "number", key: "lobes", label: "Waves per ring", min: 0, max: 12, step: 1, modulate: false },
      { kind: "number", key: "flow", label: "Flow speed", min: -5, max: 5, step: 0.05, modulate: false },
      hueStart,
      hueEnd,
      { kind: "number", key: "glow", label: "Glow", min: 0, max: 4, step: 0.05 },
    ],
  },
  aurora: {
    type: "aurora",
    label: "Aurora",
    description: "A waving curtain of light, like the northern lights.",
    defaults: { columns: 320, rows: 60, width: 30, height: 9, depth: 2.5, flow: 0.3, pointSize: 0.34, hueStart: 130, hueEnd: 290, glow: 1 },
    params: [
      { kind: "number", key: "columns", label: "Columns", min: 20, max: 500, step: 10, modulate: false },
      { kind: "number", key: "rows", label: "Points per column", min: 5, max: 100, step: 1, modulate: false },
      { kind: "number", key: "width", label: "Width", min: 2, max: 80, step: 0.5 },
      { kind: "number", key: "height", label: "Height", min: 0.5, max: 30, step: 0.1 },
      { kind: "number", key: "depth", label: "Wave depth", min: 0, max: 10, step: 0.1 },
      { kind: "number", key: "flow", label: "Flow speed", min: -3, max: 3, step: 0.05, modulate: false },
      { kind: "number", key: "pointSize", label: "Point size", min: 0.01, max: 0.8, step: 0.005 },
      hueStart,
      hueEnd,
      { kind: "number", key: "glow", label: "Glow", min: 0, max: 4, step: 0.05 },
    ],
  },
  fireflies: {
    type: "fireflies",
    label: "Fireflies",
    description: "A few large soft lights wandering around and glowing on and off.",
    defaults: { count: 70, spread: 11, height: 6, speed: 0.35, size: 0.7, hue: 55, glow: 1, twinkle: 0.8 },
    params: [
      { kind: "number", key: "count", label: "Lights", min: 5, max: 600, step: 5, modulate: false },
      { kind: "number", key: "spread", label: "Spread", min: 1, max: 40, step: 0.5 },
      { kind: "number", key: "height", label: "Height", min: 0, max: 30, step: 0.5 },
      { kind: "number", key: "speed", label: "Wander speed", min: 0, max: 3, step: 0.05, modulate: false },
      { kind: "number", key: "size", label: "Size", min: 0.05, max: 3, step: 0.05 },
      hue,
      { kind: "number", key: "glow", label: "Glow", min: 0, max: 4, step: 0.05 },
      { kind: "number", key: "twinkle", label: "Twinkle", min: 0, max: 1, step: 0.01 },
    ],
  },
  digitalRain: {
    type: "digitalRain",
    label: "Digital Rain",
    description: "Columns of light falling like rain on a screen, with bright heads and fading trails.",
    defaults: { columns: 170, trail: 26, width: 28, height: 16, depth: 12, speed: 5, pointSize: 0.3, hue: 135, glow: 1 },
    params: [
      { kind: "number", key: "columns", label: "Columns", min: 10, max: 400, step: 5, modulate: false },
      { kind: "number", key: "trail", label: "Trail length", min: 2, max: 60, step: 1, modulate: false },
      { kind: "number", key: "width", label: "Width", min: 2, max: 80, step: 0.5 },
      { kind: "number", key: "height", label: "Height", min: 2, max: 60, step: 0.5 },
      { kind: "number", key: "depth", label: "Depth", min: 0, max: 60, step: 0.5 },
      { kind: "number", key: "speed", label: "Fall speed", min: 0, max: 30, step: 0.5, modulate: false },
      { kind: "number", key: "pointSize", label: "Point size", min: 0.01, max: 0.8, step: 0.005 },
      hue,
      { kind: "number", key: "glow", label: "Glow", min: 0, max: 4, step: 0.05 },
    ],
  },
  spectrumRing: {
    type: "spectrumRing",
    label: "Spectrum Ring",
    description: "A flat circle whose edge bulges with the music. Put an image in its centre.",
    defaults: { points: 180, radius: 2.4, height: 1.6, range: 0.55, layers: 3, hueStart: 280, hueEnd: 420, mirror: true },
    params: [
      { kind: "number", key: "points", label: "Detail", min: 16, max: 512, step: 1, modulate: false },
      { kind: "number", key: "radius", label: "Radius", min: 0.3, max: 12, step: 0.05 },
      { kind: "number", key: "height", label: "Height", min: 0, max: 8, step: 0.05 },
      { kind: "number", key: "range", label: "Spectrum range", min: 0.1, max: 1, step: 0.01 },
      { kind: "number", key: "layers", label: "Echo layers", min: 1, max: 5, step: 1, modulate: false },
      hueStart,
      hueEnd,
      { kind: "toggle", key: "mirror", label: "Mirror left / right" },
    ],
  },
  particles: {
    type: "particles",
    label: "Particles",
    description: "A field of glowing dots flying toward the viewer, surging with the bass.",
    defaults: { count: 900, spread: 16, hole: 2, depth: 50, size: 0.14, speed: 1.5, boost: 14, hue: 300, saturation: 0.4, opacity: 0.8 },
    params: [
      { kind: "number", key: "count", label: "Particles", min: 50, max: 5000, step: 50, modulate: false },
      { kind: "number", key: "spread", label: "Spread", min: 1, max: 60, step: 0.5 },
      { kind: "number", key: "hole", label: "Empty centre", min: 0, max: 30, step: 0.5 },
      { kind: "number", key: "depth", label: "Depth", min: 5, max: 120, step: 1, modulate: false },
      { kind: "number", key: "size", label: "Size", min: 0.02, max: 1, step: 0.01 },
      { kind: "number", key: "speed", label: "Drift speed", min: -10, max: 10, step: 0.1, modulate: false },
      { kind: "number", key: "boost", label: "Bass surge", min: 0, max: 60, step: 0.5, modulate: false },
      hue,
      { kind: "number", key: "saturation", label: "Saturation", min: 0, max: 1, step: 0.01 },
      { kind: "number", key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 },
    ],
  },
  image: {
    type: "image",
    label: "Image",
    description: "Your own picture, cover or logo - rectangular or cropped to a circle.",
    defaults: { image: "", size: 4, round: false, opacity: 1 },
    params: [
      { kind: "image", key: "image", label: "Picture" },
      { kind: "number", key: "size", label: "Size", min: 0.2, max: 40, step: 0.1 },
      { kind: "toggle", key: "round", label: "Crop to circle" },
      { kind: "number", key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 },
    ],
  },
  model: {
    type: "model",
    label: "3D Model",
    description: "Your own 3D model from a .glb file, fitted to size and slowly turning.",
    defaults: { model: "", size: 4, spin: 20, light: 1 },
    params: [
      { kind: "model", key: "model", label: "Model file" },
      { kind: "number", key: "size", label: "Size", min: 0.2, max: 40, step: 0.1 },
      { kind: "number", key: "spin", label: "Spin", min: -360, max: 360, step: 1, unit: "°/s", modulate: false },
      { kind: "number", key: "light", label: "Studio light", min: 0, max: 4, step: 0.05 },
    ],
  },
  text: {
    type: "text",
    label: "Text",
    description: "A line of text - a title, an artist name.",
    defaults: { text: "YOUR TITLE", size: 1, color: "#ffffff", glow: 1, spacing: 0.05 },
    params: [
      { kind: "text", key: "text", label: "Text" },
      { kind: "number", key: "size", label: "Size", min: 0.1, max: 10, step: 0.05 },
      { kind: "color", key: "color", label: "Colour" },
      { kind: "number", key: "glow", label: "Glow", min: 0, max: 4, step: 0.05 },
      { kind: "number", key: "spacing", label: "Letter spacing", min: -0.1, max: 1, step: 0.01, modulate: false },
    ],
  },
  backdrop: {
    type: "backdrop",
    label: "Gradient Backdrop",
    description: "A two-colour gradient filling the whole background.",
    defaults: { top: "#1a0b3a", bottom: "#04030a" },
    params: [
      { kind: "color", key: "top", label: "Top" },
      { kind: "color", key: "bottom", label: "Bottom" },
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
  { kind: "number", key: "shake", label: "Bass shake", min: 0, max: 2, step: 0.01 },
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
  shake: 0,
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
