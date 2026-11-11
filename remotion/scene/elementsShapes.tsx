// More elements made of glowing points and lines: a tunnel, a helix, a
// spiral galaxy, a spiked orb, rippling rings, an aurora curtain, fireflies
// and falling "code rain". Same rules as everywhere: each one is a pure
// function of (params, audio, time); anything random comes from a fixed seed.

import React, {useMemo} from 'react';
import {BAND_COUNT, getBassTravel, getSpectrum} from '../audio/analysis';
import type {ElementProps} from './elements';
import {GlowLines, GlowPoints, levelAt, writeColor} from './elementsDense';
import {seededRandom} from './elementsExtra';

const num = (params: ElementProps['params'], key: string) => Number(params[key]);
const TWO_PI = Math.PI * 2;

/** `count` x `perItem` random numbers (0..1) that are the same on every render. */
function useSeeds(count: number, perItem: number, seed: number): Float32Array {
  return useMemo(() => {
    const random = seededRandom(seed);
    const out = new Float32Array(count * perItem);
    for (let i = 0; i < out.length; i++) out[i] = random();
    return out;
  }, [count, perItem, seed]);
}

// ----------------------------------------------------------------------- Tunnel

/**
 * Rings flying past the viewer along +Z, forming a tunnel around the Z axis.
 * `sides` makes it triangular, square, hexagonal ... or round. The outline
 * of every ring bulges with the spectrum, the rings twist along the depth,
 * and the flight speeds up with the bass. Place it so the camera sits
 * inside the near end.
 */
const Tunnel: React.FC<ElementProps> = ({params, analysis, audio, time}) => {
  const rings = Math.round(num(params, 'rings'));
  const sides = Math.round(num(params, 'sides'));
  const radius = num(params, 'radius');
  const spacing = num(params, 'spacing');
  const twist = num(params, 'twist');
  const bump = num(params, 'bump');
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');

  // Round tunnels need many short edges; polygons get a few points per side
  // so the spectrum can still bend their edges.
  const perRing = sides >= 16 ? 96 : sides * 8;
  const spectrum = getSpectrum(analysis, time, BAND_COUNT);
  const travel =
    time * num(params, 'speed') + getBassTravel(analysis, time) * num(params, 'boost');
  const shift = ((travel % spacing) + spacing) % spacing;
  const passed = Math.floor(travel / spacing);

  const positions = new Float32Array(rings * perRing * 6);
  const colors = new Float32Array(rings * perRing * 6);
  const corner = (around: number) => {
    if (sides >= 16) return 1;
    // Distance from the centre to the edge of a regular polygon at this angle.
    const slice = TWO_PI / sides;
    const within = ((around * TWO_PI) % slice) - slice / 2;
    return Math.cos(slice / 2) / Math.cos(within);
  };

  for (let ring = 0; ring < rings; ring++) {
    const z = shift - ring * spacing;
    const depth = ring / rings;
    // Each ring keeps its own colour and turn while it flies toward the viewer.
    const identity = ring - passed;
    const turn = identity * twist;
    const hue = hueStart + ((((identity % 24) + 24) % 24) / 24) * (hueEnd - hueStart);
    // Rings fade in from the distance and fade out again right in front of
    // the viewer, so none of them pops into or out of the picture.
    const fade = Math.min(1, (1 - depth) * 1.6) * Math.min(1, depth * 9 + 0.15);
    const brightness = fade * (0.9 + audio.level * 1.6 + audio.beat * 0.9) * glow;

    for (let i = 0; i < perRing; i++) {
      const base = (ring * perRing + i) * 6;
      for (let end = 0; end < 2; end++) {
        const around = ((i + end) % perRing) / perRing;
        const level = levelAt(spectrum, 1 - Math.abs(around * 2 - 1));
        const r = radius * corner(around) * (1 + level * bump);
        const angle = around * TWO_PI + turn;
        positions[base + end * 3] = Math.cos(angle) * r;
        positions[base + end * 3 + 1] = Math.sin(angle) * r;
        positions[base + end * 3 + 2] = z;
        writeColor(colors, base + end * 3, hue, 0.55, brightness * (0.6 + level * 0.8));
      }
    }
  }

  return <GlowLines positions={positions} colors={colors} />;
};

// ------------------------------------------------------------------------ Helix

/**
 * Strands of particles winding around the Y axis like a DNA double helix,
 * slowly turning. The strands swell where their part of the spectrum is
 * loud, and optional rungs connect two strands.
 */
const Helix: React.FC<ElementProps> = ({params, analysis, time}) => {
  const count = Math.round(num(params, 'count'));
  const strands = Math.round(num(params, 'strands'));
  const length = num(params, 'length');
  const radius = num(params, 'radius');
  const turns = num(params, 'turns');
  const bump = num(params, 'bump');
  const fuzz = num(params, 'fuzz');
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');

  const seeds = useSeeds(count, 4, 77);
  const spectrum = getSpectrum(analysis, time, BAND_COUNT);
  const spin = time * num(params, 'spin');

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const along = seeds[i * 4];
    const strand = i % strands;
    const level = levelAt(spectrum, along);
    const angle = along * turns * TWO_PI + spin + (strand / strands) * TWO_PI;
    const r = radius * (1 + level * bump);
    positions[i * 3] = Math.cos(angle) * r + (seeds[i * 4 + 1] - 0.5) * fuzz;
    positions[i * 3 + 1] = (along - 0.5) * length + (seeds[i * 4 + 2] - 0.5) * fuzz;
    positions[i * 3 + 2] = Math.sin(angle) * r + (seeds[i * 4 + 3] - 0.5) * fuzz;
    writeColor(
      colors,
      i * 3,
      hueStart + (strand / Math.max(1, strands - 1)) * (hueEnd - hueStart),
      0.55,
      (0.5 + level * 1.2) * glow,
    );
  }

  // Rungs between the first two strands, like the steps of a ladder.
  const rungCount = params.rungs && strands >= 2 ? Math.round(turns * 10) : 0;
  const rungPositions = new Float32Array(rungCount * 6);
  const rungColors = new Float32Array(rungCount * 6);
  for (let i = 0; i < rungCount; i++) {
    const along = (i + 0.5) / rungCount;
    const level = levelAt(spectrum, along);
    const r = radius * (1 + level * bump);
    const y = (along - 0.5) * length;
    for (let end = 0; end < 2; end++) {
      const angle = along * turns * TWO_PI + spin + (end / strands) * TWO_PI;
      rungPositions.set([Math.cos(angle) * r, y, Math.sin(angle) * r], i * 6 + end * 3);
      writeColor(rungColors, i * 6 + end * 3, end ? hueEnd : hueStart, 0.6, (0.2 + level * 0.8) * glow);
    }
  }

  return (
    <>
      <GlowPoints positions={positions} colors={colors} size={num(params, 'pointSize')} />
      {rungCount > 0 ? <GlowLines positions={rungPositions} colors={rungColors} /> : null}
    </>
  );
};

// ----------------------------------------------------------------------- Galaxy

/**
 * A spiral galaxy in the XZ plane: particles gathered into arms that wind
 * outward from a bright, thick centre. It turns slowly (faster inside) and
 * its arms puff up with the spectrum.
 */
const Galaxy: React.FC<ElementProps> = ({params, analysis, audio, time}) => {
  const count = Math.round(num(params, 'count'));
  const arms = Math.round(num(params, 'arms'));
  const radius = num(params, 'radius');
  const twist = num(params, 'twist');
  const spread = num(params, 'spread');
  const thickness = num(params, 'thickness');
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');

  const seeds = useSeeds(count, 4, 909);
  const spectrum = getSpectrum(analysis, time, BAND_COUNT);
  const swirl = time * num(params, 'swirl');
  const breathe = 1 + num(params, 'pulse') * (audio.bass * 0.1 + audio.beat * 0.05);

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const reach = Math.pow(seeds[i * 4], 0.8);
    const level = levelAt(spectrum, reach * 0.85);
    // How far the particle strays from the centre line of its arm; two
    // random numbers averaged gather most of them near the line.
    const stray = (seeds[i * 4 + 1] + seeds[i * 4 + 2] - 1) * spread * (0.4 + reach);
    const angle =
      ((i % arms) / arms) * TWO_PI + reach * twist + stray + swirl * (1.5 - reach);
    const distance = (0.03 + reach) * radius * breathe;
    // Thicker in the middle (the bulge), thin at the rim.
    const bulge = thickness * (0.25 + (1 - reach) * 0.75) * (0.6 + level * 1.4);

    positions[i * 3] = Math.cos(angle) * distance;
    positions[i * 3 + 1] = (seeds[i * 4 + 3] - 0.5) * 2 * bulge;
    positions[i * 3 + 2] = Math.sin(angle) * distance;
    writeColor(
      colors,
      i * 3,
      hueStart + reach * (hueEnd - hueStart),
      0.55,
      (0.45 + level * 1.1) * (1.5 - reach * 0.9) * glow,
    );
  }

  return <GlowPoints positions={positions} colors={colors} size={num(params, 'pointSize')} />;
};

// -------------------------------------------------------------------- Spike Orb

/**
 * A sphere of points whose surface throws up moving spikes, like a magnetic
 * liquid. Three patterns of spikes drift over it - broad ones raised by the
 * bass, finer ones by the mids and the highs.
 */
const SpikeOrb: React.FC<ElementProps> = ({params, analysis, audio, time}) => {
  const count = Math.round(num(params, 'count'));
  const radius = num(params, 'radius');
  const spikes = num(params, 'spikes');
  const detail = num(params, 'detail');
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');

  // Evenly spread directions (a Fibonacci lattice on the unit sphere).
  const normals = useMemo(() => {
    const out = new Float32Array(count * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / Math.max(1, count - 1)) * 2;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      out.set([Math.cos(golden * i) * ring, y, Math.sin(golden * i) * ring], i * 3);
    }
    return out;
  }, [count]);

  const flow = num(params, 'flow');
  const phase = time * flow + getBassTravel(analysis, time) * flow * 0.5;
  /** 0 on most of the surface, rising to 1 in separate round spots. */
  const spots = (x: number, y: number, z: number, scale: number, shift: number) => {
    const v =
      Math.sin(x * scale + shift) * Math.sin(y * scale - shift * 0.7) * Math.sin(z * scale + shift * 1.3);
    return v > 0 ? v : 0;
  };

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = normals[i * 3];
    const y = normals[i * 3 + 1];
    const z = normals[i * 3 + 2];
    // The small constant keeps a few low spikes moving even in silence.
    const lift =
      (0.12 + audio.bass) * spots(x, y, z, 2.2 * detail, phase) * 1.6 +
      (0.06 + audio.mid) * spots(x, y, z, 4.1 * detail, -phase * 1.4) * 1.3 +
      audio.treble * spots(x, y, z, 7.3 * detail, phase * 2.1);
    const distance = radius * (1 + audio.bass * 0.06) + lift * spikes;

    positions[i * 3] = x * distance;
    positions[i * 3 + 1] = y * distance;
    positions[i * 3 + 2] = z * distance;
    const tip = Math.min(1, lift * 1.2);
    writeColor(
      colors,
      i * 3,
      hueStart + tip * (hueEnd - hueStart),
      0.45 + tip * 0.2,
      (0.45 + tip * 1.3) * glow,
    );
  }

  return <GlowPoints positions={positions} colors={colors} size={num(params, 'pointSize')} />;
};

// ----------------------------------------------------------------- Ripple Rings

const RING_SEGMENTS = 120;

/**
 * Concentric rings in the XZ plane, like ripples on water. Every ring
 * belongs to a part of the spectrum (bass in the middle) and rises in waves
 * when that part is loud; the waves run around the rings.
 */
const RippleRings: React.FC<ElementProps> = ({params, analysis, time}) => {
  const rings = Math.round(num(params, 'rings'));
  const radius = num(params, 'radius');
  const height = num(params, 'height');
  const lobes = Math.round(num(params, 'lobes'));
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');

  const spectrum = getSpectrum(analysis, time, BAND_COUNT);
  const phase = time * num(params, 'flow');

  const positions = new Float32Array(rings * RING_SEGMENTS * 6);
  const colors = new Float32Array(rings * RING_SEGMENTS * 6);
  for (let ring = 0; ring < rings; ring++) {
    const reach = (ring + 1) / rings;
    const level = levelAt(spectrum, reach * 0.85);
    const r = reach * radius;
    const hue = hueStart + reach * (hueEnd - hueStart);

    for (let i = 0; i < RING_SEGMENTS; i++) {
      const base = (ring * RING_SEGMENTS + i) * 6;
      for (let end = 0; end < 2; end++) {
        const angle = (((i + end) % RING_SEGMENTS) / RING_SEGMENTS) * TWO_PI;
        // With no lobes the whole ring rises evenly.
        const wave = lobes > 0 ? 0.5 + 0.5 * Math.sin(angle * lobes + phase + ring * 0.45) : 1;
        positions[base + end * 3] = Math.cos(angle) * r;
        positions[base + end * 3 + 1] = level * height * wave;
        positions[base + end * 3 + 2] = Math.sin(angle) * r;
        writeColor(colors, base + end * 3, hue, 0.55, (0.3 + level * wave * 1.2) * glow);
      }
    }
  }

  return <GlowLines positions={positions} colors={colors} />;
};

// ----------------------------------------------------------------------- Aurora

/**
 * A curtain of light, like the northern lights: columns of points standing
 * along X on a slowly waving line, each column as tall as its part of the
 * spectrum is loud, fading out toward the top.
 */
const Aurora: React.FC<ElementProps> = ({params, analysis, time}) => {
  const columns = Math.round(num(params, 'columns'));
  const rows = Math.round(num(params, 'rows'));
  const width = num(params, 'width');
  const height = num(params, 'height');
  const depth = num(params, 'depth');
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');

  const seeds = useSeeds(columns * rows, 1, 31);
  const spectrum = getSpectrum(analysis, time, BAND_COUNT);
  const phase = time * num(params, 'flow');

  const positions = new Float32Array(columns * rows * 3);
  const colors = new Float32Array(columns * rows * 3);
  for (let c = 0; c < columns; c++) {
    const across = c / (columns - 1);
    const x = (across - 0.5) * width;
    const z =
      Math.sin(x * 0.4 + phase) * depth + Math.sin(x * 1.1 - phase * 1.3) * depth * 0.4;
    const level = levelAt(spectrum, across * 0.9);
    const tall = height * (0.55 + level * 0.75);
    const hue = hueStart + across * (hueEnd - hueStart);

    for (let r = 0; r < rows; r++) {
      const i = (c * rows + r) * 3;
      // Random heights within the column, so it reads as light, not as dots in rows.
      const up = (r + seeds[c * rows + r]) / rows;
      positions[i] = x;
      positions[i + 1] = up * tall;
      positions[i + 2] = z + up * depth * 0.3 * Math.sin(x * 0.7 + phase * 0.6);
      // Brightest just above the foot, fading out toward the top.
      const shine = (1 - up) * Math.min(1, up * 6 + 0.25);
      writeColor(colors, i, hue + up * 30, 0.55, shine * (0.55 + level * 1.2) * glow);
    }
  }

  return <GlowPoints positions={positions} colors={colors} size={num(params, 'pointSize')} />;
};

// -------------------------------------------------------------------- Fireflies

/**
 * A handful of large soft lights wandering around on their own looping
 * paths and glowing on and off - brighter and livelier with the highs.
 */
const Fireflies: React.FC<ElementProps> = ({params, audio, time}) => {
  const count = Math.round(num(params, 'count'));
  const spread = num(params, 'spread');
  const height = num(params, 'height');
  const hue = num(params, 'hue');
  const glow = num(params, 'glow');
  const twinkle = num(params, 'twinkle');

  const seeds = useSeeds(count, 8, 5150);
  const t = time * num(params, 'speed');

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const s = i * 8;
    positions[i * 3] = Math.sin(t * (0.3 + seeds[s]) + seeds[s + 1] * TWO_PI) * spread * (0.3 + seeds[s + 2] * 0.7);
    positions[i * 3 + 1] = (0.5 + 0.5 * Math.sin(t * (0.2 + seeds[s + 3]) + seeds[s + 4] * TWO_PI)) * height;
    positions[i * 3 + 2] = Math.cos(t * (0.25 + seeds[s + 5]) + seeds[s + 6] * TWO_PI) * spread * (0.3 + seeds[s + 2] * 0.7);

    const blink = 0.5 + 0.5 * Math.sin(time * (1 + seeds[s + 7] * 3) + seeds[s] * TWO_PI);
    const light = 1 - twinkle + twinkle * blink * blink;
    writeColor(colors, i * 3, hue + seeds[s + 4] * 30 - 15, 0.6, light * (0.5 + audio.treble * 1.2) * glow);
  }

  return <GlowPoints positions={positions} colors={colors} size={num(params, 'size')} />;
};

// ----------------------------------------------------------------- Digital Rain

/**
 * Columns of light falling like rain on a screen, each with a bright head
 * and a fading trail, spread over some depth. A column falls at its own
 * speed and shines brighter when its part of the spectrum is loud.
 */
const DigitalRain: React.FC<ElementProps> = ({params, analysis, time}) => {
  const columns = Math.round(num(params, 'columns'));
  const trail = Math.round(num(params, 'trail'));
  const width = num(params, 'width');
  const height = num(params, 'height');
  const depth = num(params, 'depth');
  const hue = num(params, 'hue');
  const glow = num(params, 'glow');

  const seeds = useSeeds(columns, 4, 2077);
  const spectrum = getSpectrum(analysis, time, BAND_COUNT);
  const fallen = time * num(params, 'speed');
  // Drops are this far apart along a trail.
  const step = height / 48;
  const loop = height + trail * step;

  const positions = new Float32Array(columns * trail * 3);
  const colors = new Float32Array(columns * trail * 3);
  for (let c = 0; c < columns; c++) {
    const x = (seeds[c * 4] - 0.5) * width;
    const z = (seeds[c * 4 + 1] - 0.5) * depth;
    const level = levelAt(spectrum, seeds[c * 4]);
    const head = height / 2 - ((fallen * (0.5 + seeds[c * 4 + 2]) + seeds[c * 4 + 3] * loop) % loop);

    for (let k = 0; k < trail; k++) {
      const i = (c * trail + k) * 3;
      const y = head + k * step;
      const fade = 1 - k / trail;
      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = z;
      // The head is nearly white, the trail takes the element's colour.
      const visible = y > -height / 2 && y < height / 2 ? 1 : 0;
      writeColor(
        colors,
        i,
        hue,
        k === 0 ? 0.85 : 0.5,
        visible * Math.pow(fade, 1.4) * (0.7 + level * 1.5) * (k === 0 ? 1.8 : 1) * glow,
      );
    }
  }

  return <GlowPoints positions={positions} colors={colors} size={num(params, 'pointSize')} />;
};

export const SHAPE_ELEMENT_COMPONENTS = {
  tunnel: Tunnel,
  helix: Helix,
  galaxy: Galaxy,
  spikeOrb: SpikeOrb,
  rippleRings: RippleRings,
  aurora: Aurora,
  fireflies: Fireflies,
  digitalRain: DigitalRain,
};
