// Which shelf of the gallery each built-in template sits on. A template can
// be on more than one. An id that is not listed here falls back to "Other",
// so a new template shows up in the gallery before it has been sorted.

export type TemplateCategoryId =
  | "particles"
  | "geometry"
  | "bars"
  | "space"
  | "retro"
  | "titled"
  | "other";

export const TEMPLATE_CATEGORIES: { id: TemplateCategoryId; label: string }[] = [
  { id: "particles", label: "Particles" },
  { id: "geometry", label: "Geometry" },
  { id: "bars", label: "Bars and rings" },
  { id: "space", label: "Space" },
  { id: "retro", label: "Retro" },
  { id: "titled", label: "With title or cover" },
  { id: "other", label: "Other" },
];

const BY_TEMPLATE: Record<string, TemplateCategoryId[]> = {
  radialBars: ["bars"],
  sphereSwarm: ["particles"],
  terrainWave: ["retro"],
  liquidGold: ["particles"],
  nova: ["particles"],
  hyperdrive: ["space"],
  helix: ["geometry"],
  galaxy: ["space"],
  orb: ["particles"],
  ripples: ["bars"],
  aurora: ["space"],
  codeRain: ["retro"],
  vortex: ["particles"],
  resonance: ["geometry"],
  pendulum: ["geometry"],
  hypercube: ["geometry"],
  equalizer: ["bars", "retro"],
  radar: ["retro"],
  solar: ["space"],
  sunflower: ["geometry"],
  knot: ["geometry"],
  jellyfish: ["particles"],
  pulseRing: ["bars", "titled"],
  nebula: ["space"],
  eventHorizon: ["space"],
  lissajous: ["geometry"],
  fountain: ["particles"],
  soundWaves: ["bars"],
  shockwave: ["bars"],
  oscilloscope: ["retro"],
  halo: ["bars", "titled"],
  fireworks: ["particles"],
  nightCity: ["retro"],
};

/** The categories of a template, the first one being its main shelf. */
export function templateCategories(id: string): TemplateCategoryId[] {
  return BY_TEMPLATE[id] ?? ["other"];
}

export function categoryLabel(id: TemplateCategoryId): string {
  return TEMPLATE_CATEGORIES.find((category) => category.id === id)?.label ?? "Other";
}
