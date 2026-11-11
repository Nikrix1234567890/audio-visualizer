// "Dense" elements: shapes made of tens of thousands of soft glowing points
// instead of a few hundred solid pieces. Where points overlap their light
// adds up, so busy areas turn bright and white-hot on their own - that is
// what gives these elements their cloudy, luminous look.
//
// Same rules as the other element files: every position is a pure function
// of (params, audio, time). The "random" placement comes from a fixed seed.

import React, {useMemo} from 'react';
import {AdditiveBlending, BufferAttribute, Color} from 'three';
import {BAND_COUNT, getBassTravel, getSpectrum} from '../audio/analysis';
import type {ElementProps} from './elements';
import {getSoftDot, seededRandom} from './elementsExtra';

const num = (params: ElementProps['params'], key: string) => Number(params[key]);
const TWO_PI = Math.PI * 2;

/** Spectrum level at a position 0..1 across the bands, smoothly interpolated. */
export function levelAt(spectrum: number[], position: number): number {
  const band = Math.min(1, Math.max(0, position)) * (BAND_COUNT - 1);
  const lower = Math.floor(band);
  const upper = Math.min(BAND_COUNT - 1, lower + 1);
  return spectrum[lower] + (spectrum[upper] - spectrum[lower]) * (band - lower);
}

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** Writes an hsl colour (hue in degrees), scaled by `brightness`, into a colour buffer. */
const scratch = new Color();
export function writeColor(
  target: Float32Array,
  offset: number,
  hue: number,
  lightness: number,
  brightness: number,
) {
  scratch.setHSL((((hue % 360) + 360) % 360) / 360, 0.95, lightness);
  target[offset] = scratch.r * brightness;
  target[offset + 1] = scratch.g * brightness;
  target[offset + 2] = scratch.b * brightness;
}

/** A cloud of soft glowing dots; overlapping dots add up to brighter light. */
export const GlowPoints: React.FC<{
  positions: Float32Array;
  colors: Float32Array;
  size: number;
}> = ({positions, colors, size}) => (
  <points frustumCulled={false}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      <bufferAttribute attach="attributes-color" args={[colors, 3]} />
    </bufferGeometry>
    <pointsMaterial
      map={getSoftDot()}
      vertexColors
      size={size}
      sizeAttenuation
      transparent
      depthWrite={false}
      blending={AdditiveBlending}
      toneMapped={false}
    />
  </points>
);

/** Glowing line segments: every two points in `positions` form one line. */
export const GlowLines: React.FC<{
  positions: Float32Array;
  colors: Float32Array;
}> = ({positions, colors}) => (
  <lineSegments frustumCulled={false}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      <bufferAttribute attach="attributes-color" args={[colors, 3]} />
    </bufferGeometry>
    <lineBasicMaterial
      vertexColors
      transparent
      depthWrite={false}
      blending={AdditiveBlending}
      toneMapped={false}
    />
  </lineSegments>
);

// ----------------------------------------------------------------- Wave Surface

/**
 * A rolling surface of points (and optionally a fine grid) in the XZ plane.
 * Three layers of waves move across it: broad swells driven by the bass,
 * medium ones by the mids, fine ripples by the highs - and rings of the
 * live spectrum spread out from the centre. The waves travel faster the
 * more bass has played, so the surface flows with the music.
 */
const WaveSurface: React.FC<ElementProps> = ({params, analysis, audio, time}) => {
  const side = Math.round(num(params, 'resolution'));
  const size = num(params, 'size');
  const height = num(params, 'height');
  const detail = num(params, 'detail');
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');
  const round = Boolean(params.round);

  // Grid lines: every point joined to its right and far neighbour.
  const gridIndex = useMemo(() => {
    const out = new Uint32Array((side - 1) * side * 4);
    let o = 0;
    for (let z = 0; z < side; z++) {
      for (let x = 0; x < side; x++) {
        const i = z * side + x;
        if (x < side - 1) {
          out[o++] = i;
          out[o++] = i + 1;
        }
        if (z < side - 1) {
          out[o++] = i;
          out[o++] = i + side;
        }
      }
    }
    return new BufferAttribute(out, 1);
  }, [side]);

  const spectrum = getSpectrum(analysis, time, BAND_COUNT);
  const flow = num(params, 'flow');
  const phase = time * flow + getBassTravel(analysis, time) * flow * 0.6;
  const half = size / 2;

  const positions = new Float32Array(side * side * 3);
  const colors = new Float32Array(side * side * 3);

  for (let iz = 0; iz < side; iz++) {
    const z = (iz / (side - 1) - 0.5) * size;
    for (let ix = 0; ix < side; ix++) {
      const x = (ix / (side - 1) - 0.5) * size;
      const distance = Math.sqrt(x * x + z * z) / half;
      // Fades the surface out toward a circular rim (or not at all).
      const rim = round ? 1 - smoothstep(0.72, 1, distance) : 1;

      const swell =
        Math.sin(x * 0.35 * detail + phase * 1.3) * Math.cos(z * 0.31 * detail - phase);
      const wave = Math.sin((x + z) * 0.8 * detail + phase * 2.1) * 0.5;
      const ripple =
        Math.sin(x * 2.3 * detail - phase * 3) * Math.sin(z * 2.1 * detail + phase * 2.6) * 0.25;
      // Averaged over a few neighbouring bands, so single loud notes make
      // soft hills instead of sharp circular steps.
      const rings =
        (levelAt(spectrum, distance * 0.8 - 0.05) +
          levelAt(spectrum, distance * 0.8) +
          levelAt(spectrum, distance * 0.8 + 0.05)) /
        3;

      const lift =
        rim *
        (audio.bass * 1.4 * swell +
          audio.mid * 1.1 * wave +
          audio.treble * ripple +
          rings * 0.5 +
          // Some movement even in silence, so the surface never freezes.
          0.3 * swell +
          0.1 * wave);

      const i = (iz * side + ix) * 3;
      positions[i] = x;
      positions[i + 1] = lift * height;
      positions[i + 2] = z;

      // Crests are brighter and lean toward the end colour.
      const crest = Math.min(1, Math.max(0, 0.45 + lift * 0.45));
      writeColor(
        colors,
        i,
        hueStart + crest * (hueEnd - hueStart),
        0.42 + crest * 0.2,
        rim * (0.3 + crest * 0.9) * glow,
      );
    }
  }

  const position = new BufferAttribute(positions, 3);
  const color = new BufferAttribute(colors, 3);

  return (
    <>
      <points frustumCulled={false}>
        <bufferGeometry>
          <primitive attach="attributes-position" object={position} />
          <primitive attach="attributes-color" object={color} />
        </bufferGeometry>
        <pointsMaterial
          map={getSoftDot()}
          vertexColors
          size={num(params, 'pointSize')}
          sizeAttenuation
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>

      {params.grid ? (
        <lineSegments frustumCulled={false}>
          <bufferGeometry>
            <primitive attach="index" object={gridIndex} />
            <primitive attach="attributes-position" object={position} />
            <primitive attach="attributes-color" object={color} />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.14}
            depthWrite={false}
            blending={AdditiveBlending}
            toneMapped={false}
          />
        </lineSegments>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- Particle Disc

/**
 * A glowing disc of particles lying in the XZ plane, denser toward the
 * centre. Each ring of the disc belongs to a part of the spectrum (bass in
 * the middle, highs at the edge) and puffs up when that part is loud. The
 * disc slowly swirls - faster in the middle - and breathes with the bass.
 * Rays shoot out from its edge, one per frequency band.
 */
const ParticleDisc: React.FC<ElementProps> = ({params, analysis, audio, time}) => {
  const count = Math.round(num(params, 'count'));
  const radius = num(params, 'radius');
  const height = num(params, 'height');
  const rays = Math.round(num(params, 'rays'));
  const rayLength = num(params, 'rayLength');
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');
  const swirl = num(params, 'swirl');

  // Per particle: angle, distance from the centre (0..1), and where between
  // the bottom and top of the cloud it sits (-1..1).
  const seeds = useMemo(() => {
    const random = seededRandom(4242);
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      out[i * 3] = random() * TWO_PI;
      // A square root would spread the particles evenly over the disc; a
      // higher exponent crowds them toward a bright centre.
      out[i * 3 + 1] = Math.pow(random(), 0.95);
      out[i * 3 + 2] = (random() + random() + random()) / 1.5 - 1;
    }
    return out;
  }, [count]);

  const spectrum = getSpectrum(analysis, time, BAND_COUNT);
  const breathe = 1 + num(params, 'pulse') * (audio.bass * 0.12 + audio.beat * 0.06);

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const reach = seeds[i * 3 + 1];
    const level = levelAt(spectrum, reach * 0.85);
    const angle = seeds[i * 3] + time * swirl * (1.4 - reach);
    const distance = reach * radius * breathe;

    positions[i * 3] = Math.cos(angle) * distance;
    positions[i * 3 + 1] = seeds[i * 3 + 2] * (0.1 + level * height) * (1.2 - reach * 0.6);
    positions[i * 3 + 2] = Math.sin(angle) * distance;

    writeColor(
      colors,
      i * 3,
      hueStart + reach * (hueEnd - hueStart),
      0.5,
      (0.3 + level * 0.9) * (1.35 - reach * 0.75) * glow,
    );
  }

  // Rays: a bright inner end fading to nothing at the tip.
  const rayPositions = new Float32Array(rays * 6);
  const rayColors = new Float32Array(rays * 6);
  for (let i = 0; i < rays; i++) {
    const around = i / rays;
    // Mirrored, so neighbouring rays never jump from the highest to the lowest band.
    const level = levelAt(spectrum, (1 - Math.abs(around * 2 - 1)) * 0.9);
    const angle = around * TWO_PI + time * swirl * 0.4;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const from = radius * breathe * 0.92;
    const to = from + (0.08 + level) * rayLength;

    rayPositions.set([cos * from, 0, sin * from, cos * to, 0, sin * to], i * 6);
    writeColor(rayColors, i * 6, hueEnd, 0.6, (0.5 + level * 1.4) * glow);
    // The tip stays black, which additive blending draws as "nothing".
  }

  return (
    <>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={getSoftDot()}
          vertexColors
          size={num(params, 'pointSize')}
          sizeAttenuation
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>

      {rays > 0 ? (
        <lineSegments frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[rayPositions, 3]} />
            <bufferAttribute attach="attributes-color" args={[rayColors, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
            toneMapped={false}
          />
        </lineSegments>
      ) : null}
    </>
  );
};

export const DENSE_ELEMENT_COMPONENTS = {
  waveSurface: WaveSurface,
  particleDisc: ParticleDisc,
};
