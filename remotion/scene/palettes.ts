// Colour palettes: one click recolours a whole scene so everything in it
// belongs together. A palette is not stored in the scene - applying one
// simply sets the colour parameters of every element, which the user can
// then still change one by one.

import type { SceneDocument, SceneElement } from "./definitions";

export type Palette = {
  id: string;
  label: string;
  /** Main hue in degrees. */
  from: number;
  /** Second hue; close to `from` for a single-colour palette. */
  to: number;
  /** Set for a rainbow: blend the long way through the whole colour wheel. */
  rainbow?: true;
};

export const PALETTES: Palette[] = [
  { id: "gold", label: "Gold", from: 36, to: 52 },
  { id: "ember", label: "Ember", from: 12, to: 34 },
  { id: "rose", label: "Rose", from: 335, to: 352 },
  { id: "violet", label: "Violet", from: 262, to: 288 },
  { id: "ice", label: "Ice", from: 192, to: 214 },
  { id: "lime", label: "Lime", from: 84, to: 108 },
  { id: "dusk", label: "Dusk", from: 18, to: 318 },
  { id: "neon", label: "Neon", from: 305, to: 188 },
  { id: "acid", label: "Acid", from: 96, to: 282 },
  { id: "ocean", label: "Ocean", from: 176, to: 248 },
  { id: "aurora", label: "Aurora", from: 148, to: 276 },
  { id: "spectrum", label: "Spectrum", from: 200, to: 500, rainbow: true },
];

/**
 * The hue pair to store so that a gradient between the two colours takes
 * the short way round the colour wheel (orange to pink through red, not
 * through green and blue). Elements blend hues as plain numbers, so the
 * short way can mean lifting one of them a full turn above 360. A rainbow
 * palette deliberately goes the long way and is kept as it is.
 */
function shortWay(palette: Palette): { from: number; to: number } {
  let { from, to } = palette;
  if (!palette.rainbow) {
    if (to - from > 180) from += 360;
    else if (from - to > 180) to += 360;
  }
  return { from, to };
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const h = (((hue % 360) + 360) % 360) / 60;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs((h % 2) - 1));
  const [r, g, b] =
    h < 1 ? [chroma, x, 0]
    : h < 2 ? [x, chroma, 0]
    : h < 3 ? [0, chroma, x]
    : h < 4 ? [0, x, chroma]
    : h < 5 ? [x, 0, chroma]
    : [chroma, 0, x];
  const m = lightness - chroma / 2;
  return `#${[r, g, b]
    .map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function recolour(element: SceneElement, palette: Palette): SceneElement {
  const params = { ...element.params };
  const { from, to } = shortWay(palette);

  if ("hueStart" in params && "hueEnd" in params) {
    params.hueStart = from;
    params.hueEnd = to;
  }
  if ("hue" in params) {
    // Accents (cores, suns, dust) take the second colour, for contrast.
    params.hue = ((palette.to % 360) + 360) % 360;
  }
  if (element.type === "backdrop") {
    params.top = hslToHex(palette.from, 0.55, 0.1);
    params.bottom = hslToHex(palette.to, 0.5, 0.025);
  }
  return { ...element, params };
}

/** A copy of the scene with every element recoloured to the palette. */
export function applyPalette(scene: SceneDocument, palette: Palette): SceneDocument {
  return { ...scene, elements: scene.elements.map((e) => recolour(e, palette)) };
}

/** CSS gradient for a palette's swatch. */
export function paletteGradient(palette: Palette): string {
  const { from, to } = shortWay(palette);
  return `linear-gradient(135deg, hsl(${from} 95% 55%), hsl(${(from + to) / 2} 95% 55%), hsl(${to} 95% 55%))`;
}
