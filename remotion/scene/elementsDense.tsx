// "Dense" elements: shapes made of tens of thousands of soft glowing points
// instead of a few hundred solid pieces. Where points overlap their light
// adds up, so busy areas turn bright and white-hot on their own - that is
// what gives these elements their cloudy, luminous look.
//
// The big clouds are animated on the graphics card (see ./gpuCloud.tsx).
// The small helpers at the top (GlowPoints, GlowLines) are for things with
// only a few hundred points or lines, where computing them in JavaScript
// costs nothing.

import React, {useMemo} from 'react';
import {AdditiveBlending, Color} from 'three';
import {BAND_COUNT, getBassTravel, getSpectrum} from '../audio/analysis';
import type {ElementProps} from './elements';
import {getSoftDot} from './elementsExtra';
import {GpuCloud} from './gpuCloud';

const num = (params: ElementProps['params'], key: string) => Number(params[key]);
const TWO_PI = Math.PI * 2;

/** Spectrum level at a position 0..1 across the bands, smoothly interpolated. */
export function levelAt(spectrum: number[], position: number): number {
  const band = Math.min(1, Math.max(0, position)) * (BAND_COUNT - 1);
  const lower = Math.floor(band);
  const upper = Math.min(BAND_COUNT - 1, lower + 1);
  return spectrum[lower] + (spectrum[upper] - spectrum[lower]) * (band - lower);
}

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

/**
 * A small cloud of soft glowing dots computed in JavaScript. For a few
 * hundred points only - big clouds belong in a GpuCloud.
 */
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

/** Glowing line segments computed in JavaScript: every two points form one line. */
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

// `position` holds the grid point as x and z in -1..1.
const WAVE_BODY = /* glsl */ `
  float x = position.x * uHalf;
  float z = position.z * uHalf;
  float dist = length(position.xz);
  // Fades the surface out toward a circular rim (or not at all).
  float rim = uRound > 0.5 ? 1.0 - smoothstep(0.72, 1.0, dist) : 1.0;

  float swell = sin(x * 0.35 * uDetail + uPhase * 1.3) * cos(z * 0.31 * uDetail - uPhase);
  float wave = sin((x + z) * 0.8 * uDetail + uPhase * 2.1) * 0.5;
  float ripple = sin(x * 2.3 * uDetail - uPhase * 3.0) * sin(z * 2.1 * uDetail + uPhase * 2.6) * 0.25;
  // Averaged over neighbouring bands: soft hills instead of sharp circles.
  float rings = (levelAt(dist * 0.8 - 0.05) + levelAt(dist * 0.8) + levelAt(dist * 0.8 + 0.05)) / 3.0;

  float lift = rim * (
    uBass * 1.4 * swell + uMid * 1.1 * wave + uTreble * ripple + rings * 0.5
    // Some movement even in silence, so the surface never freezes.
    + 0.3 * swell + 0.1 * wave
  );

  p = vec3(x, lift * uHeight, z);
  // Crests are brighter and lean toward the end colour.
  float crest = clamp(0.45 + lift * 0.45, 0.0, 1.0);
  c = hsl(mix(uHueStart, uHueEnd, crest), 0.95, 0.42 + crest * 0.2) * rim * (0.3 + crest * 0.9) * uGlow;
`;

/**
 * A rolling surface of points (and optionally a fine grid) in the XZ plane.
 * Three layers of waves move across it: broad swells driven by the bass,
 * medium ones by the mids, fine ripples by the highs - and rings of the
 * live spectrum spread out from the centre. The waves travel faster the
 * more bass has played, so the surface flows with the music.
 */
const WaveSurface: React.FC<ElementProps> = (props) => {
  const {params, analysis, time} = props;
  const side = Math.round(num(params, 'resolution'));
  const flow = num(params, 'flow');

  const grid = useMemo(() => {
    const base = new Float32Array(side * side * 3);
    // Grid lines: every point joined to its right and far neighbour.
    const lines = new Uint32Array((side - 1) * side * 4);
    let o = 0;
    for (let z = 0; z < side; z++) {
      for (let x = 0; x < side; x++) {
        const i = z * side + x;
        base[i * 3] = (x / (side - 1)) * 2 - 1;
        base[i * 3 + 2] = (z / (side - 1)) * 2 - 1;
        if (x < side - 1) {
          lines[o++] = i;
          lines[o++] = i + 1;
        }
        if (z < side - 1) {
          lines[o++] = i;
          lines[o++] = i + side;
        }
      }
    }
    return {base, lines};
  }, [side]);

  const shared = {
    element: props,
    count: side * side,
    seed: 1,
    base: grid.base,
    body: WAVE_BODY,
    uniforms: {
      uHalf: num(params, 'size') / 2,
      uHeight: num(params, 'height'),
      uDetail: num(params, 'detail'),
      // The bass adds to the distance travelled, so the waves speed up with it.
      uPhase: time * flow + getBassTravel(analysis, time) * flow * 0.6,
      uRound: params.round ? 1 : 0,
    },
    hueStart: num(params, 'hueStart'),
    hueEnd: num(params, 'hueEnd'),
    glow: num(params, 'glow'),
  };

  return (
    <>
      <GpuCloud {...shared} size={num(params, 'pointSize')} />
      {params.grid ? <GpuCloud {...shared} lines={grid.lines} opacity={0.14} /> : null}
    </>
  );
};

// ---------------------------------------------------------------- Particle Disc

// aSeed: angle, distance from the centre, and three numbers for the height.
const DISC_BODY = /* glsl */ `
  // A square root would spread the particles evenly; a higher power crowds
  // them toward a bright centre.
  float reach = pow(aSeed.y, 0.95);
  float level = levelAt(reach * 0.85);
  float angle = aSeed.x * TAU + uSwirl * (1.4 - reach);
  float dist = reach * uRadius * uBreathe;
  // Where between the bottom and top of the cloud the particle sits (-1..1).
  float layer = (aSeed.z + aSeed.w + aSeed2.x) / 1.5 - 1.0;

  p = vec3(
    cos(angle) * dist,
    layer * (0.1 + level * uHeight) * (1.2 - reach * 0.6),
    sin(angle) * dist
  );
  c = hsl(mix(uHueStart, uHueEnd, reach), 0.95, 0.5) * (0.3 + level * 0.9) * (1.35 - reach * 0.75) * uGlow;
`;

/**
 * A glowing disc of particles lying in the XZ plane, denser toward the
 * centre. Each ring of the disc belongs to a part of the spectrum (bass in
 * the middle, highs at the edge) and puffs up when that part is loud. The
 * disc slowly swirls - faster in the middle - and breathes with the bass.
 * Rays shoot out from its edge, one per frequency band.
 */
const ParticleDisc: React.FC<ElementProps> = (props) => {
  const {params, analysis, audio, time} = props;
  const radius = num(params, 'radius');
  const rays = Math.round(num(params, 'rays'));
  const rayLength = num(params, 'rayLength');
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');
  const swirl = num(params, 'swirl');
  const breathe = 1 + num(params, 'pulse') * (audio.bass * 0.12 + audio.beat * 0.06);

  // Rays: only a few dozen lines, so these are simply computed here. A
  // bright inner end fading to nothing at the tip.
  const spectrum = getSpectrum(analysis, time, BAND_COUNT);
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
      <GpuCloud
        element={props}
        count={Math.round(num(params, 'count'))}
        seed={4242}
        body={DISC_BODY}
        uniforms={{
          uRadius: radius,
          uHeight: num(params, 'height'),
          uSwirl: time * swirl,
          uBreathe: breathe,
        }}
        hueStart={hueStart}
        hueEnd={hueEnd}
        glow={glow}
        size={num(params, 'pointSize')}
      />
      {rays > 0 ? <GlowLines positions={rayPositions} colors={rayColors} /> : null}
    </>
  );
};

export const DENSE_ELEMENT_COMPONENTS = {
  waveSurface: WaveSurface,
  particleDisc: ParticleDisc,
};
