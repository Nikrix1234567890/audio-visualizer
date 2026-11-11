// Starting points offered to the user. A template is just a complete scene
// document - once loaded it is edited like any other scene.

import {
  DEFAULT_CAMERA,
  DEFAULT_LOOK,
  createElement,
  type SceneDocument,
  type Tempo,
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
    id: "vortex",
    label: "Vortex",
    focusElementId: "vortex",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 14, height: 7, orbit: 0.05, bob: 1, drift: 0.1, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#030108", bloom: 0.8, vignette: 0.75 },
      lookBindings: {},
      elements: [
        createElement("vortex", { id: "vortex", position: [0, 1.5, 0] }),
        createElement("stars", { id: "stars", params: { count: 2500, size: 3 } }),
      ],
    },
  },
  {
    id: "resonance",
    label: "Resonance",
    focusElementId: "plate",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 13, height: 10, orbit: 0.05, bob: 1, drift: 0.1, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#020308", bloom: 0.8, vignette: 0.75 },
      lookBindings: {},
      elements: [
        createElement("resonancePlate", { id: "plate" }),
      ],
    },
  },
  {
    id: "pendulum",
    label: "Pendulum",
    focusElementId: "pendulums",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 15, height: 2, orbit: 0, sway: 3, bob: 0.5, drift: 0.12, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#02030a", bloom: 0.9, vignette: 0.75 },
      lookBindings: {},
      elements: [
        createElement("pendulumWave", { id: "pendulums", position: [0, 1, 0], rotation: [0, 58, 0] }),
      ],
    },
  },
  {
    id: "hypercube",
    label: "Hypercube",
    focusElementId: "cube",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 10, height: 1.5, orbit: 0.12, bob: 1, drift: 0.2, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#02020a", bloom: 1.2, vignette: 0.75 },
      lookBindings: {},
      elements: [
        createElement("hypercube", { id: "cube" }),
        createElement("particles", { id: "dust", name: "Dust", params: { count: 400, spread: 16, hole: 5, depth: 40, size: 0.14, speed: 0.3, boost: 2, hue: 250, saturation: 0.6, opacity: 0.5 } }),
      ],
    },
  },
  {
    id: "equalizer",
    label: "Equalizer",
    focusElementId: "wall",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 15, height: 0, orbit: 0, sway: 3, bob: 0.5, drift: 0.15, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#020403", bloom: 0.7, vignette: 0.7 },
      lookBindings: {},
      elements: [
        createElement("ledWall", { id: "wall" }),
      ],
    },
  },
  {
    id: "radar",
    label: "Radar",
    focusElementId: "radar",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 12, height: 10, orbit: 0.03, bob: 0.6, drift: 0.1, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#010502", bloom: 1.1, vignette: 0.8 },
      lookBindings: {},
      elements: [
        createElement("radar", { id: "radar" }),
      ],
    },
  },
  {
    id: "solar",
    label: "Solar",
    focusElementId: "star",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 12, height: 1, orbit: 0.08, bob: 1.5, drift: 0.12, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#050201", bloom: 0.9, vignette: 0.7 },
      lookBindings: {},
      elements: [
        createElement("corona", { id: "star" }),
        createElement("stars", { id: "stars", params: { count: 2500, size: 3 } }),
      ],
    },
  },
  {
    id: "sunflower",
    label: "Sunflower",
    focusElementId: "flower",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 13, height: 10, orbit: 0.04, bob: 1, drift: 0.1, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#050302", bloom: 0.8, vignette: 0.75 },
      lookBindings: {},
      elements: [
        createElement("sunflower", { id: "flower" }),
      ],
    },
  },
  {
    id: "knot",
    label: "Knot",
    focusElementId: "knot",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 11, height: 2, orbit: 0.15, bob: 1.5, drift: 0.2, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#020309", bloom: 0.8, vignette: 0.75 },
      lookBindings: {},
      elements: [
        createElement("torusKnot", { id: "knot" }),
        createElement("particles", { id: "dust", name: "Dust", params: { count: 400, spread: 16, hole: 6, depth: 40, size: 0.14, speed: 0.3, boost: 2, hue: 220, saturation: 0.6, opacity: 0.5 } }),
      ],
    },
  },
  {
    id: "jellyfish",
    label: "Jellyfish",
    focusElementId: "jelly",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 15, height: -1, orbit: 0.06, bob: 1, drift: 0.15, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#010409", bloom: 0.8, vignette: 0.7 },
      lookBindings: {},
      elements: [
        createElement("jellyfish", {
          id: "jelly",
          position: [0, 2.5, 0],
          // It bobs upward with every swell of the bass.
          bindings: { "position.1": { source: "bass", amount: 1 } },
        }),
        createElement("particles", { id: "plankton", name: "Plankton", params: { count: 500, spread: 18, hole: 0, depth: 40, size: 0.12, speed: 0.15, boost: 1, hue: 190, saturation: 0.5, opacity: 0.45 } }),
        createElement("backdrop", { id: "backdrop", params: { top: "#04121f", bottom: "#010205" } }),
      ],
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
  {
    id: "nebula",
    label: "Nebula",
    focusElementId: "nebula",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 18, height: 3, orbit: 0.05, bob: 1, drift: 0.1, fov: 45 },
      cameraBindings: {},
      // Opens far away and glides into the cloud.
      cameraKeyframes: {
        distance: [
          { t: 0, v: 26, ease: "smooth" },
          { t: 10, v: 11, ease: "smooth" },
        ],
      },
      look: { ...DEFAULT_LOOK, background: "#03020a", bloom: 0.9, vignette: 0.7 },
      lookBindings: {},
      elements: [
        createElement("nebula", { id: "nebula", tempo: { amount: 0.6, period: 7, mode: "wave" } }),
        createElement("stars", { id: "stars", params: { count: 3000, size: 3 } }),
      ],
    },
  },
  {
    id: "eventHorizon",
    label: "Event Horizon",
    focusElementId: "hole",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 16, height: 5, orbit: 0.06, bob: 1.2, drift: 0.09, fov: 45 },
      cameraBindings: { shake: { source: "bass", amount: 0.15 } },
      // Starts above the disc and sinks to its edge.
      cameraKeyframes: {
        height: [
          { t: 0, v: 11, ease: "smooth" },
          { t: 9, v: 2.5, ease: "smooth" },
        ],
      },
      look: { ...DEFAULT_LOOK, background: "#020104", bloom: 1, vignette: 0.75 },
      lookBindings: {},
      elements: [
        createElement("blackHole", {
          id: "hole",
          rotation: [0, 0, 10],
          tempo: { amount: 0.7, period: 4, mode: "beat" },
        }),
        createElement("stars", { id: "stars", params: { count: 2500, size: 3 } }),
      ],
    },
  },
  {
    id: "lissajous",
    label: "Lissajous",
    focusElementId: "curve",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 12, height: 1, orbit: 0.15, bob: 0.8, drift: 0.15, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#020409", bloom: 1.1, vignette: 0.7 },
      lookBindings: {},
      elements: [
        createElement("lissajous", {
          id: "curve",
          bindings: { scale: { source: "beat", amount: 0.06 } },
          // The curve grows thicker as the track goes on.
          keyframes: {
            thickness: [
              { t: 0, v: 0.04, ease: "smooth" },
              { t: 12, v: 0.4, ease: "smooth" },
            ],
          },
          tempo: { amount: 0.7, period: 6, mode: "wave" },
        }),
        createElement("particles", {
          id: "dust",
          name: "Dust",
          params: { count: 400, spread: 16, hole: 6, depth: 40, size: 0.14, speed: 0.3, boost: 2, hue: 200, saturation: 0.6, opacity: 0.5 },
        }),
      ],
    },
  },
  {
    id: "fountain",
    label: "Fountain",
    focusElementId: "fountain",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 13, height: 3.5, orbit: 0.1, bob: 0.6, drift: 0.15, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#06030a", bloom: 1.1, vignette: 0.7 },
      lookBindings: {},
      elements: [
        createElement("fountain", {
          id: "fountain",
          position: [0, FLOOR_Y, 0],
          tempo: { amount: 0.7, period: 4, mode: "beat" },
        }),
        createElement("glowDisc", { id: "glow", position: [0, FLOOR_Y + 0.02, 0] }),
        createElement("gridFloor", { id: "floor", position: [0, FLOOR_Y, 0] }),
      ],
    },
  },
  {
    id: "soundWaves",
    label: "Sound Waves",
    focusElementId: "waves",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 14, height: 5, orbit: 0, sway: 3, bob: 1, drift: 0.2, fov: 45 },
      cameraBindings: {},
      look: { ...DEFAULT_LOOK, background: "#02030a", bloom: 1, vignette: 0.7 },
      lookBindings: {},
      elements: [
        createElement("spectrumWaves", {
          id: "waves",
          position: [0, -1, 0],
          params: { glow: 1.7, pointSize: 0.14, height: 4.5 },
        }),
        createElement("backdrop", { id: "backdrop", params: { top: "#0b1030", bottom: "#020208" } }),
      ],
    },
  },
  {
    id: "shockwave",
    label: "Shockwave",
    focusElementId: "wave",
    scene: {
      version: 1,
      camera: { ...DEFAULT_CAMERA, distance: 14, height: 7, orbit: 0.08, bob: 1, drift: 0.12, fov: 45 },
      cameraBindings: { shake: { source: "beat", amount: 0.12 } },
      look: { ...DEFAULT_LOOK, background: "#030208", bloom: 1.1, vignette: 0.7 },
      lookBindings: { bloom: { source: "beat", amount: 0.5 } },
      elements: [
        createElement("shockwave", {
          id: "wave",
          tempo: { amount: 0.8, period: 4, mode: "beat" },
        }),
        createElement("core", {
          id: "core",
          params: { radius: 0.5, hue: 200, pulse: 1, light: 3 },
          bindings: { scale: { source: "beat", amount: 0.4 } },
        }),
      ],
    },
  },
];

// Tempo swings: the motion of these elements slows down and speeds up
// again in a wave (see warpTime in ./keyframes.ts), which gives a scene a
// breathing, slow-motion feel. By template id, then element id.
const TEMPO_SWINGS: Record<string, Record<string, Tempo>> = {
  hyperdrive: {
    tunnel: { amount: 0.8, period: 4, mode: "beat" },
    streaks: { amount: 0.8, period: 4, mode: "beat" },
  },
  helix: { helix: { amount: 0.6, period: 5, mode: "wave" } },
  galaxy: { galaxy: { amount: 0.7, period: 6, mode: "wave" } },
  orb: { orb: { amount: 0.6, period: 5, mode: "beat" } },
  vortex: { vortex: { amount: 0.8, period: 5, mode: "beat" } },
  solar: { star: { amount: 0.5, period: 8, mode: "wave" } },
  sunflower: { flower: { amount: 0.6, period: 6, mode: "wave" } },
  knot: { knot: { amount: 0.7, period: 6, mode: "wave" } },
  jellyfish: { jelly: { amount: 0.6, period: 4, mode: "wave" } },
};

for (const template of TEMPLATES) {
  for (const element of template.scene.elements) {
    const tempo = TEMPO_SWINGS[template.id]?.[element.id];
    if (tempo) element.tempo = tempo;
  }
}

export const DEFAULT_TEMPLATE = TEMPLATES[0];

/** A private copy of a scene, safe to edit. A scene is plain data, so a deep copy is exact. */
export function cloneScene(scene: SceneDocument): SceneDocument {
  return structuredClone(scene);
}
