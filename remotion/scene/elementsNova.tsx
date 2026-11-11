// A fourth family of elements: nebula, black hole, Lissajous curve,
// fountain, spectrum waves, shockwave, oscilloscope, halo, fireworks and
// skyline.
//
// All of them are point clouds drawn by the graphics card through GpuCloud
// (see ./gpuCloud.tsx): the points are placed by a few lines of shader code
// from fixed random numbers, the time and the audio. Pure functions of
// (params, audio, time), like every element.

import React from 'react';
import {getBassTravel} from '../audio/analysis';
import type {ElementProps} from './elements';
import {GpuCloud} from './gpuCloud';

const num = (params: ElementProps['params'], key: string) => Number(params[key]);

/** The usual colour and size settings every cloud element passes on. */
const look = (params: ElementProps['params']) => ({
  hueStart: num(params, 'hueStart'),
  hueEnd: num(params, 'hueEnd'),
  glow: num(params, 'glow'),
  size: num(params, 'pointSize'),
});

/** A phase that advances with time and runs ahead when the bass plays. */
const flow = ({params, analysis, time, trackTime}: ElementProps) =>
  time * num(params, 'speed') +
  getBassTravel(analysis, trackTime) * num(params, 'boost');

// ----------------------------------------------------------------------- Nebula

// aSeed: direction (two numbers), distance from the centre, wobble offset.
const NEBULA_BODY = /* glsl */ `
  float theta = aSeed.x * TAU;
  float cosPhi = aSeed.y * 2.0 - 1.0;
  float sinPhi = sqrt(1.0 - cosPhi * cosPhi);
  // More points near the middle than at the rim.
  float reach = pow(aSeed.z, 0.6);
  vec3 q = vec3(cos(theta) * sinPhi, cosPhi * uFlatten, sin(theta) * sinPhi) * reach * uRadius;

  // Slow billowing: three sine fields pushing the cloud around.
  vec3 wobble = vec3(
    sin(q.y * 0.9 + uFlow + aSeed.w * TAU),
    sin(q.z * 0.8 - uFlow * 0.7 + aSeed.w * 3.0),
    sin(q.x * 0.7 + uFlow * 1.3));
  float level = levelAt(reach * 0.8);

  p = q * (1.0 + uBass * uPulse * 0.12) + wobble * uTurbulence * (0.4 + reach);
  c = hsl(mix(uHueStart, uHueEnd, reach + wobble.x * 0.15), 0.85, 0.5)
    * (0.2 + level * 1.2 + (1.0 - reach) * 0.5) * uGlow;
  size = uSize * (0.6 + aSeed2.x * 1.2);
`;

/** A billowing cloud of glowing gas, brightest in the middle. */
const Nebula: React.FC<ElementProps> = (props) => {
  const {params} = props;
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={4101}
      body={NEBULA_BODY}
      uniforms={{
        uRadius: num(params, 'radius'),
        uFlatten: num(params, 'flatten'),
        uTurbulence: num(params, 'turbulence'),
        uPulse: num(params, 'pulse'),
        uFlow: flow(props),
      }}
      {...look(params)}
    />
  );
};

// ------------------------------------------------------------------- Black hole

// aSeed: distance within the disc, angle, height, jet spread.
// aSeed2: disc-or-jet choice, jet side, position along the jet.
const BLACK_HOLE_BODY = /* glsl */ `
  float reach = aSeed.x;
  float r = mix(uInner, uRadius, pow(reach, 1.6));
  // Matter near the hole circles much faster than matter at the rim.
  float angle = aSeed.y * TAU + uSpin * pow(uInner / r, 1.5) * 6.0;
  float level = levelAt(reach * 0.9);

  if (aSeed2.x < uJets) {
    // A share of the points shoots out along the axis, both ways.
    float side = aSeed2.y < 0.5 ? -1.0 : 1.0;
    float along = fract(aSeed2.z + uSpin * 0.35);
    float width = along * 0.5 * (aSeed.w - 0.5);
    p = vec3(
      width * cos(aSeed.y * TAU),
      side * along * uRadius * 1.3 * (0.5 + uBass),
      width * sin(aSeed.y * TAU));
    c = hsl(uHueEnd, 0.7, 0.7) * (1.0 - along) * (0.5 + uBeat) * uGlow;
  } else {
    float lift = (aSeed.z - 0.5) * uThickness * (0.3 + reach) * (0.6 + level);
    p = vec3(cos(angle) * r, lift, sin(angle) * r);
    float heat = 1.0 - reach;
    c = hsl(mix(uHueEnd, uHueStart, heat), 0.95, 0.45 + heat * 0.3)
      * (0.3 + heat * 1.4 + level) * uGlow;
  }
`;

/**
 * A disc of matter circling an empty centre, fastest and hottest at the
 * inner edge, with two jets along the axis that flare with the bass.
 */
const BlackHole: React.FC<ElementProps> = (props) => {
  const {params, time} = props;
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={4202}
      body={BLACK_HOLE_BODY}
      uniforms={{
        uRadius: num(params, 'radius'),
        uInner: num(params, 'inner'),
        uThickness: num(params, 'thickness'),
        uJets: num(params, 'jets'),
        uSpin: time * num(params, 'speed'),
      }}
      {...look(params)}
    />
  );
};

// -------------------------------------------------------------------- Lissajous

// aSeed: position along the curve, then three numbers of sideways jitter.
const LISSAJOUS_BODY = /* glsl */ `
  float u = aSeed.x;
  float t = u * TAU;
  float level = levelAt(abs(u * 2.0 - 1.0));
  vec3 q = vec3(
    sin(uA * t + uPhase),
    sin(uB * t + uPhase * 0.7),
    sin(uC * t + uPhase * 1.3));
  vec3 jitter = (vec3(aSeed.y, aSeed.z, aSeed.w) - 0.5) * uThickness * (0.5 + level * 2.0);

  p = q * uRadius * (1.0 + uBass * 0.08) + jitter;
  c = hsl(mix(uHueStart, uHueEnd, u), 0.95, 0.55) * (0.5 + level * 1.4) * uGlow;
`;

/**
 * A closed curve woven from three sine waves - the figure an oscilloscope
 * draws, in three dimensions. It slowly morphs and swells with the spectrum.
 */
const Lissajous: React.FC<ElementProps> = (props) => {
  const {params, time} = props;
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={4303}
      body={LISSAJOUS_BODY}
      uniforms={{
        uA: Math.round(num(params, 'a')),
        uB: Math.round(num(params, 'b')),
        uC: Math.round(num(params, 'c')),
        uRadius: num(params, 'radius'),
        uThickness: num(params, 'thickness'),
        uPhase: time * num(params, 'speed'),
      }}
      {...look(params)}
    />
  );
};

// --------------------------------------------------------------------- Fountain

// aSeed: point in its life, power, direction, how far it flies out.
const FOUNTAIN_BODY = /* glsl */ `
  float life = fract(aSeed.x + uFlow);
  float power = 0.6 + aSeed.y * 0.4 + levelAt(aSeed2.x) * uReact;
  float angle = aSeed.z * TAU;
  float reachOut = uSpread * (0.3 + aSeed.w);
  // Up and back down over one life: a parabola.
  float up = 4.0 * life * (1.0 - life) * uHeight * power;

  p = vec3(cos(angle) * reachOut * life, up, sin(angle) * reachOut * life);
  float fade = sin(life * 3.14159);
  c = hsl(mix(uHueStart, uHueEnd, life), 0.9, 0.55) * fade * (0.5 + power * 0.7) * uGlow;
  size = uSize * (1.2 - life * 0.6);
`;

/** Sparks thrown up from one point, arcing out and falling back - higher with the music. */
const Fountain: React.FC<ElementProps> = (props) => {
  const {params} = props;
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={4404}
      body={FOUNTAIN_BODY}
      uniforms={{
        uHeight: num(params, 'height'),
        uSpread: num(params, 'spread'),
        uReact: num(params, 'react'),
        uFlow: flow(props),
      }}
      {...look(params)}
    />
  );
};

// --------------------------------------------------------------- Spectrum waves

// aSeed: row, position along the row.
const WAVES_BODY = /* glsl */ `
  float row = floor(aSeed.x * uRows);
  float rowT = uRows > 1.0 ? row / (uRows - 1.0) : 0.0;
  float x = aSeed.y;
  // Bass in the middle, highs at both ends.
  float level = levelAt(abs(x * 2.0 - 1.0));
  float ripple = sin(x * 9.0 + uFlow * 2.0 - rowT * 4.0) * 0.12;
  float h = (level * (1.0 - rowT * 0.6) + ripple * (0.3 + uBass)) * uHeight;

  p = vec3((x - 0.5) * uWidth, h, (rowT - 0.5) * uDepth);
  c = hsl(mix(uHueStart, uHueEnd, rowT), 0.95, 0.55)
    * (0.35 + level * 1.5) * (1.0 - rowT * 0.5) * uGlow;
`;

/** Rows of dots that take the shape of the spectrum, one behind the other. */
const SpectrumWaves: React.FC<ElementProps> = (props) => {
  const {params} = props;
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={4505}
      body={WAVES_BODY}
      uniforms={{
        uRows: Math.round(num(params, 'rows')),
        uWidth: num(params, 'width'),
        uDepth: num(params, 'depth'),
        uHeight: num(params, 'height'),
        uFlow: flow(props),
      }}
      {...look(params)}
    />
  );
};

// -------------------------------------------------------------------- Shockwave

// aSeed: ring, angle on the ring.
const SHOCKWAVE_BODY = /* glsl */ `
  float ring = floor(aSeed.x * uRings);
  // Every ring is at a different point of its way out.
  float phase = fract(ring / uRings + uFlow);
  float angle = aSeed.y * TAU;
  float level = levelAt(aSeed.y < 0.5 ? aSeed.y * 2.0 : (1.0 - aSeed.y) * 2.0);
  float r = phase * uRadius * (1.0 + level * uWobble * 0.3);
  // Fades in right after leaving the centre, and out towards the rim.
  float fade = (1.0 - phase) * smoothstep(0.0, 0.08, phase);

  p = vec3(cos(angle) * r, sin(phase * 3.14159) * uLift * (0.3 + uBass), sin(angle) * r);
  c = hsl(mix(uHueStart, uHueEnd, phase), 0.95, 0.55)
    * fade * (0.6 + level * 1.5 + uBeat * 0.8) * uGlow;
`;

/** Rings that burst out from the centre one after another, pushed by the bass. */
const Shockwave: React.FC<ElementProps> = (props) => {
  const {params} = props;
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={4606}
      body={SHOCKWAVE_BODY}
      uniforms={{
        uRings: Math.round(num(params, 'rings')),
        uRadius: num(params, 'radius'),
        uLift: num(params, 'lift'),
        uWobble: num(params, 'wobble'),
        uFlow: flow(props),
      }}
      {...look(params)}
    />
  );
};

// ----------------------------------------------------------------- Oscilloscope

// aSeed: position along the line, two numbers of thickness jitter.
const SCOPE_BODY = /* glsl */ `
  float x = aSeed.x;
  // A trace built from eight waves, each as strong as its part of the
  // spectrum: bass makes slow swells, highs a fine ripple on top.
  float y = 0.0;
  for (int k = 0; k < 8; k++) {
    float fk = float(k);
    y += sin(x * (4.0 + fk * 7.0) + uFlow * (1.0 + fk * 0.6))
      * levelAt(fk / 8.0) / (1.0 + fk * 0.35);
  }
  // Pinned at both ends, like a plucked string.
  float envelope = sin(x * 3.14159);

  p = vec3(
    (x - 0.5) * uWidth,
    y * uHeight * envelope + (aSeed.y - 0.5) * uThickness,
    (aSeed.z - 0.5) * uThickness);
  c = hsl(mix(uHueStart, uHueEnd, x), 0.95, 0.55) * (0.6 + abs(y)) * uGlow;
`;

/** A glowing trace like the line on an oscilloscope, shaped by the spectrum. */
const Oscilloscope: React.FC<ElementProps> = (props) => {
  const {params} = props;
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={4707}
      body={SCOPE_BODY}
      uniforms={{
        uWidth: num(params, 'width'),
        uHeight: num(params, 'height'),
        uThickness: num(params, 'thickness'),
        uFlow: flow(props),
      }}
      {...look(params)}
    />
  );
};

// ------------------------------------------------------------------------- Halo

// aSeed: which bar, how far out along the bar, sideways jitter.
const HALO_BODY = /* glsl */ `
  float bar = floor(aSeed.x * uBars);
  float angle = (bar + 0.5 + (aSeed.z - 0.5) * uFill) / uBars * TAU + uTurn;
  // Mirrored: bass at the top, highs at the bottom, the same left and right.
  float across = abs(mod(angle - uTurn, TAU) / 3.14159 - 1.0);
  float level = levelAt(1.0 - across);
  float r = uRadius * (1.0 + uBeat * uPulse * 0.06) + aSeed.y * (0.05 + level) * uReach;

  p = vec3(sin(angle) * r, cos(angle) * r, 0.0);
  c = hsl(mix(uHueStart, uHueEnd, across), 0.95, 0.55)
    * (0.4 + level * 1.4) * (1.0 - aSeed.y * 0.5) * uGlow;
`;

/**
 * A ring of bars that face the viewer and shoot outwards with the
 * spectrum, mirrored left and right - the classic music-channel look.
 */
const Halo: React.FC<ElementProps> = (props) => {
  const {params, time} = props;
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={4808}
      body={HALO_BODY}
      uniforms={{
        uBars: Math.round(num(params, 'bars')),
        uRadius: num(params, 'radius'),
        uReach: num(params, 'reach'),
        uFill: num(params, 'fill'),
        uPulse: num(params, 'pulse'),
        uTurn: time * num(params, 'speed'),
      }}
      {...look(params)}
    />
  );
};

// -------------------------------------------------------------------- Fireworks

const FIREWORK_FUNCTIONS = /* glsl */ `
  // A repeatable "random" number 0..1 from any number.
  float hash(float n) {
    return fract(sin(n * 12.9898) * 43758.5453);
  }
`;

// aSeed: which burst, direction (two numbers), speed. aSeed2.x: sparkle.
const FIREWORK_BODY = /* glsl */ `
  float burst = floor(aSeed.x * uBursts);
  // Bursts go off one after another; each has its own place in the cycle.
  float clock = uFlow + burst * 0.6180339;
  float phase = fract(clock);
  float round = floor(clock);
  // A new spot in the sky for every time a burst goes off.
  vec3 centre = vec3(
    (hash(burst * 7.1 + round * 3.3) - 0.5) * uSpread,
    (hash(burst * 2.7 + round * 5.9) - 0.3) * uSpread * 0.5,
    (hash(burst * 4.3 + round * 1.7) - 0.5) * uSpread * 0.4);

  float theta = aSeed.y * TAU;
  float cosPhi = aSeed.z * 2.0 - 1.0;
  vec3 direction = vec3(cos(theta) * sqrt(1.0 - cosPhi * cosPhi), cosPhi, sin(theta) * sqrt(1.0 - cosPhi * cosPhi));
  // Fast at first, then slowing; and sinking as it fades.
  float out1 = 1.0 - pow(1.0 - phase, 3.0);
  p = centre + direction * out1 * uRadius * (0.5 + aSeed.w * 0.5) * (0.8 + uBass * 0.4);
  p.y -= phase * phase * uRadius * 0.5;

  float fade = pow(1.0 - phase, 1.5);
  float sparkle = 0.6 + 0.4 * sin(aSeed2.x * 40.0 + uFlow * 60.0);
  c = hsl(uHueStart + hash(burst * 1.3 + round) * (uHueEnd - uHueStart), 0.95, 0.6)
    * fade * sparkle * (0.8 + uBeat * 0.8) * uGlow;
  size = uSize * (0.5 + fade);
`;

/** Bursts of sparks going off around the scene, one after another. */
const Fireworks: React.FC<ElementProps> = (props) => {
  const {params} = props;
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={4909}
      functions={FIREWORK_FUNCTIONS}
      body={FIREWORK_BODY}
      uniforms={{
        uBursts: Math.round(num(params, 'bursts')),
        uRadius: num(params, 'radius'),
        uSpread: num(params, 'spread'),
        uFlow: flow(props),
      }}
      {...look(params)}
    />
  );
};

// ---------------------------------------------------------------------- Skyline

// aSeed: which building, across its front, up its height, which row.
const SKYLINE_BODY = /* glsl */ `
  float building = floor(aSeed.x * uBuildings);
  float row = floor(aSeed.w * uRows);
  float id = building + row * 97.0;
  float where = (building + 0.5) / uBuildings;
  // Every building has its own height; the music makes it grow. Bass in
  // the middle of the row, highs at both ends.
  float level = levelAt(abs(where * 2.0 - 1.0));
  float tall = (0.25 + hash(id) * 0.75) * uHeight * (0.45 + level * uReact);

  // Points sit on a grid of windows on the front of the building.
  float columns = 5.0;
  float floors = max(2.0, floor(tall * 3.0));
  float column = floor(aSeed.y * columns);
  float level2 = floor(aSeed.z * floors);
  float widthEach = uWidth / uBuildings;

  p = vec3(
    (where - 0.5) * uWidth + ((column + 0.5) / columns - 0.5) * widthEach * 0.75,
    (level2 + 0.5) / floors * tall,
    -row * uDepth + hash(id * 3.1) * uDepth * 0.5);
  // Some windows are dark, and a few flicker with the highs.
  float lit = step(0.35, hash(id * 13.0 + column * 7.0 + level2 * 3.0));
  float flicker = 0.7 + 0.3 * sin(uTime * 3.0 + hash(id + column + level2) * TAU) * uTreble;
  c = hsl(mix(uHueStart, uHueEnd, (level2 + 0.5) / floors), 0.9, 0.55)
    * lit * flicker * (0.5 + level * 1.2) * (1.0 - row / max(1.0, uRows) * 0.6) * uGlow;
`;

/** A city skyline of lit windows whose towers grow with the spectrum. */
const Skyline: React.FC<ElementProps> = (props) => {
  const {params} = props;
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={5010}
      functions={FIREWORK_FUNCTIONS}
      body={SKYLINE_BODY}
      uniforms={{
        uBuildings: Math.round(num(params, 'buildings')),
        uRows: Math.round(num(params, 'rows')),
        uWidth: num(params, 'width'),
        uHeight: num(params, 'height'),
        uDepth: num(params, 'depth'),
        uReact: num(params, 'react'),
      }}
      {...look(params)}
    />
  );
};

export const NOVA_ELEMENT_COMPONENTS = {
  nebula: Nebula,
  blackHole: BlackHole,
  lissajous: Lissajous,
  fountain: Fountain,
  spectrumWaves: SpectrumWaves,
  shockwave: Shockwave,
  oscilloscope: Oscilloscope,
  halo: Halo,
  fireworks: Fireworks,
  skyline: Skyline,
};
