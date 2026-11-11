// Starting points offered to the user. A template is just a complete scene
// document - once loaded it is edited like any other scene.

import {
  DEFAULT_CAMERA,
  DEFAULT_LOOK,
  createElement,
  type Bindings,
  type SceneDocument,
} from "./definitions";

export type SceneTemplate = {
  id: string;
  label: string;
  /** Element selected in the editor right after loading the template. */
  focusElementId: string;
  scene: SceneDocument;
};

const FLOOR_Y = -1.2;

export const TEMPLATES: SceneTemplate[] = [
  {
    id: "radialBars",
    label: "Radial Bars",
    focusElementId: "ring",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK },
      lookBindings: {},
      elements: [
        createElement("barRing", {
          id: "ring",
          position: [0, FLOOR_Y, 0],
          // The whole ring kicks outward a little on every beat.
          bindings: { scale: { source: "beat", amount: 0.06 } },
        }),
        createElement("glowDisc", { id: "glow", position: [0, FLOOR_Y, 0] }),
        createElement("gridFloor", { id: "floor", position: [0, FLOOR_Y - 0.05, 0] }),
      ],
    },
  },
  {
    id: "sphereSwarm",
    label: "Sphere Swarm",
    focusElementId: "swarm",
    scene: {
      version: 1,
      camera: {
        ...DEFAULT_CAMERA,
        distance: 12.8,
        height: 0,
        bob: 3.2,
        drift: 0.15,
      },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK },
      lookBindings: {},
      elements: [
        createElement("sphereSwarm", {
          id: "swarm",
          // The swarm breathes with the bass.
          bindings: { scale: { source: "bass", amount: 0.12 } },
        }),
        createElement("core", { id: "core" }),
      ],
    },
  },
  {
    id: "terrainWave",
    label: "Terrain Wave",
    focusElementId: "terrain",
    scene: {
      version: 1,
      camera: {
        ...DEFAULT_CAMERA,
        distance: 29.6,
        height: 12.8,
        orbit: 0,
        sway: 2.4,
        bob: 0,
        drift: 0.125,
      },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, fog: true, fogNear: 8, fogFar: 44 },
      // The glow flares up with the bass.
      lookBindings: { bloom: { source: "bass", amount: 0.8 } },
      elements: [
        createElement("terrainLines", { id: "terrain" }),
        createElement("sun", { id: "sun", position: [0, 2.4, -31.6] }),
        createElement("stars", { id: "stars" }),
      ],
    },
  },
  {
    id: "liquidGold",
    label: "Liquid Gold",
    focusElementId: "surface",
    scene: {
      version: 1,
      camera: {
        ...DEFAULT_CAMERA,
        distance: 15,
        height: 6.5,
        orbit: 0.06,
        bob: 0.8,
        drift: 0.12,
        fov: 45,
      },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#030302", bloom: 0.7, vignette: 0.75 },
      lookBindings: { bloom: { source: "bass", amount: 0.5 } },
      elements: [
        createElement("waveSurface", { id: "surface", position: [0, -1, 0] }),
        createElement("particles", {
          id: "dust",
          name: "Dust",
          position: [0, 3, 0],
          params: { count: 500, spread: 14, hole: 0, depth: 30, size: 0.16, speed: 0.4, boost: 3, hue: 40, saturation: 0.8, opacity: 0.7 },
        }),
      ],
    },
  },
  {
    id: "nova",
    label: "Nova",
    focusElementId: "disc",
    scene: {
      version: 1,
      camera: {
        ...DEFAULT_CAMERA,
        distance: 13,
        height: 7,
        orbit: 0.08,
        bob: 1,
        drift: 0.1,
        fov: 45,
        shake: 0.08,
      },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#030302", bloom: 0.8, vignette: 0.8 },
      lookBindings: {},
      elements: [
        createElement("particleDisc", {
          id: "disc",
          bindings: { scale: { source: "beat", amount: 0.05 } },
        }),
        createElement("particles", {
          id: "dust",
          name: "Dust",
          params: { count: 400, spread: 18, hole: 6, depth: 40, size: 0.16, speed: 0.3, boost: 2, hue: 40, saturation: 0.8, opacity: 0.6 },
        }),
      ],
    },
  },
  {
    id: "hyperdrive",
    label: "Hyperdrive",
    focusElementId: "tunnel",
    scene: {
      version: 1,
      // Inside the tunnel, looking down its length.
      camera: { ...DEFAULT_CAMERA, distance: 6, height: 0, orbit: 0, sway: 0.5, bob: 0.3, drift: 0.4, fov: 75, shake: 0.06 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#020207", bloom: 1.1, vignette: 0.7 },
      lookBindings: {},
      elements: [
        createElement("tunnel", { id: "tunnel", position: [0, 0, 8] }),
        createElement("particles", {
          id: "streaks",
          name: "Star streaks",
          params: { count: 500, spread: 10, hole: 3.5, depth: 60, size: 0.12, speed: 8, boost: 30, hue: 200, saturation: 0.5, opacity: 0.7 },
        }),
      ],
    },
  },
  {
    id: "helix",
    label: "Helix",
    focusElementId: "helix",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 15, height: 0, orbit: 0.1, bob: 1.5, drift: 0.15, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#02030a", bloom: 0.8, vignette: 0.75 },
      lookBindings: {},
      elements: [
        createElement("helix", { id: "helix", rotation: [0, 0, 28] }),
        createElement("particles", {
          id: "dust",
          name: "Dust",
          params: { count: 400, spread: 16, hole: 4, depth: 40, size: 0.14, speed: 0.3, boost: 2, hue: 250, saturation: 0.6, opacity: 0.5 },
        }),
      ],
    },
  },
  {
    id: "galaxy",
    label: "Galaxy",
    focusElementId: "galaxy",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 15, height: 8, orbit: 0.04, bob: 1.5, drift: 0.08, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#010104", bloom: 0.8, vignette: 0.7 },
      lookBindings: {},
      elements: [
        createElement("galaxy", { id: "galaxy", rotation: [0, 0, 12] }),
        createElement("stars", { id: "stars", params: { count: 3000, size: 3 } }),
      ],
    },
  },
  {
    id: "orb",
    label: "Spike Orb",
    focusElementId: "orb",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 11, height: 1, orbit: 0.12, bob: 1, drift: 0.2, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#02020a", bloom: 0.8, vignette: 0.75 },
      lookBindings: {},
      elements: [
        createElement("spikeOrb", {
          id: "orb",
          bindings: { scale: { source: "beat", amount: 0.05 } },
        }),
        createElement("particles", {
          id: "dust",
          name: "Dust",
          params: { count: 400, spread: 16, hole: 6, depth: 40, size: 0.14, speed: 0.3, boost: 2, hue: 270, saturation: 0.6, opacity: 0.5 },
        }),
      ],
    },
  },
  {
    id: "ripples",
    label: "Ripples",
    focusElementId: "rings",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 15, height: 8, orbit: 0.06, bob: 1, drift: 0.1, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#01040a", bloom: 1, vignette: 0.75 },
      lookBindings: {},
      elements: [
        createElement("rippleRings", { id: "rings", position: [0, -1, 0] }),
        createElement("core", {
          id: "core",
          position: [0, -0.6, 0],
          params: { radius: 0.3, hue: 190, pulse: 2, light: 0 },
        }),
      ],
    },
  },
  {
    id: "aurora",
    label: "Aurora",
    focusElementId: "aurora",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 13, height: 2, orbit: 0, sway: 3, bob: 0.4, drift: 0.12, fov: 55 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#01030a", bloom: 0.9, vignette: 0.6 },
      lookBindings: {},
      elements: [
        createElement("aurora", { id: "aurora", position: [0, -3, -3] }),
        createElement("fireflies", {
          id: "fireflies",
          position: [0, -3, 3],
          params: { count: 40, size: 0.45, glow: 0.7 },
        }),
        createElement("stars", { id: "stars", params: { count: 2500, size: 3 } }),
      ],
    },
  },
  {
    id: "codeRain",
    label: "Code Rain",
    focusElementId: "rain",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 13, height: 0, orbit: 0, sway: 1.5, bob: 0.5, drift: 0.15, fov: 55 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#010402", bloom: 1, vignette: 0.7 },
      lookBindings: { bloom: { source: "bass", amount: 0.5 } },
      elements: [createElement("digitalRain", { id: "rain" })],
    },
  },
  {
    id: "pulseRing",
    label: "Pulse Ring",
    focusElementId: "picture",
    scene: {
      version: 1,
      // Straight on, almost still, shaking with the bass.
      camera: {
        ...DEFAULT_CAMERA,
        distance: 10,
        height: 0,
        orbit: 0,
        sway: 0.5,
        bob: 0.25,
        drift: 0.3,
        shake: 0.18,
      },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#04030a", bloom: 0.9 },
      lookBindings: {},
      elements: [
        createElement("image", {
          id: "picture",
          name: "Centre picture",
          position: [0, 0, 0.05],
          params: { size: 4.6, round: true },
          bindings: { scale: { source: "bass", amount: 0.1 } },
        }),
        createElement("spectrumRing", {
          id: "ring",
          bindings: { scale: { source: "bass", amount: 0.1 } },
        }),
        createElement("particles", { id: "particles" }),
        createElement("backdrop", { id: "backdrop" }),
      ],
    },
  },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0];

function cloneBindings(bindings: Bindings): Bindings {
  return Object.fromEntries(
    Object.entries(bindings).map(([key, binding]) => [key, { ...binding }]),
  );
}

/** A private copy of a template's scene, safe to edit. */
export function cloneScene(scene: SceneDocument): SceneDocument {
  return {
    version: 1,
    camera: { ...scene.camera },
    cameraBindings: cloneBindings(scene.cameraBindings),
    look: { ...scene.look },
    lookBindings: cloneBindings(scene.lookBindings),
    elements: scene.elements.map((element) => ({
      ...element,
      position: [...element.position],
      rotation: [...element.rotation],
      params: { ...element.params },
      bindings: cloneBindings(element.bindings),
    })),
  };
}
