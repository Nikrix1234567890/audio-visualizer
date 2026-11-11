// Starting points offered to the user. A template is just a complete scene
// document - once loaded it is edited like any other scene.

import {
  DEFAULT_CAMERA,
  DEFAULT_LOOK,
  createElement,
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
      look: { ...DEFAULT_LOOK },
      elements: [
        createElement("barRing", { id: "ring", position: [0, FLOOR_Y, 0] }),
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
      look: { ...DEFAULT_LOOK },
      elements: [
        createElement("sphereSwarm", { id: "swarm" }),
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
      look: { ...DEFAULT_LOOK, fog: true, fogNear: 8, fogFar: 44 },
      elements: [
        createElement("terrainLines", { id: "terrain" }),
        createElement("sun", { id: "sun", position: [0, 2.4, -31.6] }),
        createElement("stars", { id: "stars" }),
      ],
    },
  },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0];

/** A private copy of a template's scene, safe to edit. */
export function cloneScene(scene: SceneDocument): SceneDocument {
  return {
    version: 1,
    camera: { ...scene.camera },
    look: { ...scene.look },
    elements: scene.elements.map((element) => ({
      ...element,
      position: [...element.position],
      rotation: [...element.rotation],
      params: { ...element.params },
    })),
  };
}
