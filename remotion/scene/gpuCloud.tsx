// Point clouds and line sets that are animated by the graphics card.
//
// The first dense elements computed every point's position in JavaScript
// for every frame and re-uploaded tens of thousands of numbers to the GPU
// each time - which stuttered even on a fast machine. Here the per-point
// data (a base position and a few random numbers) is uploaded ONCE. Each
// frame only a handful of numbers change (time, audio levels, the spectrum,
// the element's parameters) and a small vertex shader works out where every
// point is and what colour it has. 30,000 points cost the browser nothing.
//
// It stays deterministic: the shader's inputs are a pure function of the
// frame, so the preview and the render still draw exactly the same picture.

import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {AdditiveBlending} from 'three';
import {BAND_COUNT, getBassTravel, getSpectrum} from '../audio/analysis';
import type {ElementProps} from './elements';
import {seededRandom} from './elementsExtra';

/** Available to every element's shader code. */
const SHADER_HEADER = /* glsl */ `
  #define TAU 6.283185307179586
  uniform float uTime;      // seconds
  uniform float uBass;      // 0..1
  uniform float uMid;
  uniform float uTreble;
  uniform float uLevel;
  uniform float uBeat;      // 1 on a beat, fading
  uniform float uTravel;    // "seconds of full bass" played so far
  uniform float uSpectrum[${BAND_COUNT}];
  uniform float uGlow;
  uniform float uHueStart;
  uniform float uHueEnd;
  uniform float uSize;      // point size in world units
  uniform float uScale;     // pixels per world unit at distance 1
  attribute vec4 aSeed;     // four random numbers 0..1 per point
  attribute vec4 aSeed2;    // four more
  varying vec3 vColor;

  // Spectrum level at a position 0..1 across the bands (bass first).
  float levelAt(float position) {
    float band = clamp(position, 0.0, 1.0) * ${BAND_COUNT - 1}.0;
    int lower = int(floor(band));
    int upper = min(${BAND_COUNT - 1}, lower + 1);
    return mix(uSpectrum[lower], uSpectrum[upper], fract(band));
  }

  // Hue in degrees, saturation and lightness 0..1 -> colour.
  vec3 hsl(float hue, float saturation, float lightness) {
    float h = mod(hue, 360.0) / 60.0;
    vec3 rgb = clamp(abs(mod(h + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    vec3 color = lightness + saturation * (rgb - 0.5) * (1.0 - abs(2.0 * lightness - 1.0));
    // The picture is composed in linear light; convert like three.js does.
    return pow(max(color, 0.0), vec3(2.2));
  }
`;

const vertexShader = (functions: string, body: string) => /* glsl */ `
  ${SHADER_HEADER}
  ${functions}
  void main() {
    vec3 p = position;      // where the point is
    vec3 c = vec3(1.0);     // its colour (brightness included)
    float size = uSize;     // its size
    ${body}
    vColor = c;
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = size * uScale / -viewPosition.z;
  }
`;

// A round dot with a soft edge. Drawn additively: overlapping dots add up.
const POINT_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float falloff = max(0.0, 1.0 - length(gl_PointCoord - 0.5) * 2.0);
    gl_FragColor = vec4(vColor, falloff * falloff);
  }
`;

const LINE_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, uOpacity);
  }
`;

const COMMON_UNIFORMS = [
  'uTime',
  'uBass',
  'uMid',
  'uTreble',
  'uLevel',
  'uBeat',
  'uTravel',
  'uGlow',
  'uHueStart',
  'uHueEnd',
  'uSize',
  'uScale',
  'uOpacity',
];

/**
 * Eight random numbers (0..1) per point that are the same on every render.
 * With `every` above 1, each run of that many points shares one set - for
 * points that belong together, like the drops of one falling column.
 */
export function useCloudSeeds(count: number, seed: number, every = 1) {
  return useMemo(() => {
    const random = seededRandom(seed);
    const a = new Float32Array(count * 4);
    const b = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const first = i - (i % every);
      for (let k = 0; k < 4; k++) {
        a[i * 4 + k] = i === first ? random() : a[first * 4 + k];
        b[i * 4 + k] = i === first ? random() : b[first * 4 + k];
      }
    }
    return {a, b};
  }, [count, seed, every]);
}

/**
 * Draws `count` points (or line segments) whose positions and colours are
 * computed on the graphics card by `body` - GLSL code that may set `p`
 * (position), `c` (colour) and `size`, using the audio uniforms, the random
 * `aSeed` / `aSeed2`, the static `position`, and the element's own numbers
 * passed in `uniforms` (each becomes a `uniform float` of that name).
 */
export const GpuCloud: React.FC<{
  element: ElementProps;
  count: number;
  /** Seed for the per-point random numbers. */
  seed: number;
  /** Let runs of this many points share their random numbers. */
  seedEvery?: number;
  /** Static base position per point (3 numbers each); zeros when omitted. */
  base?: Float32Array;
  /** Draw line segments between these point indices instead of dots. */
  lines?: Uint32Array;
  /** Extra GLSL functions used by `body`. */
  functions?: string;
  body: string;
  uniforms: Record<string, number>;
  hueStart: number;
  hueEnd: number;
  glow: number;
  size?: number;
  opacity?: number;
}> = ({
  element,
  count,
  seed,
  seedEvery = 1,
  base,
  lines,
  functions = '',
  body,
  uniforms,
  hueStart,
  hueEnd,
  glow,
  size = 0.1,
  opacity = 1,
}) => {
  const {analysis, audio, time} = element;
  const seeds = useCloudSeeds(count, seed, seedEvery);
  const zeros = useMemo(() => new Float32Array(count * 3), [count]);
  // Pixels per world unit: the height of the picture being drawn, halved -
  // the same rule three.js uses for its own point sprites.
  const scale = useThree((state) => (state.size.height * state.viewport.dpr) / 2);

  const names = Object.keys(uniforms).join(',');
  const isLines = Boolean(lines);
  // Built once per element type; afterwards only uniform values change.
  const material = useMemo(() => {
    const initial: Record<string, {value: unknown}> = {
      uSpectrum: {value: new Array(BAND_COUNT).fill(0)},
    };
    for (const name of [...COMMON_UNIFORMS, ...names.split(',').filter(Boolean)]) {
      initial[name] = {value: 0};
    }
    const declarations = names
      .split(',')
      .filter(Boolean)
      .map((name) => `uniform float ${name};`)
      .join('\n');

    return {
      uniforms: initial,
      vertexShader: vertexShader(`${declarations}\n${functions}`, body),
      fragmentShader: isLines ? LINE_FRAGMENT : POINT_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    };
  }, [names, functions, body, isLines]);

  // The values for this frame, handed to the shader as plain numbers.
  const live: Record<string, unknown> = {
    'uniforms-uTime-value': time,
    'uniforms-uBass-value': audio.bass,
    'uniforms-uMid-value': audio.mid,
    'uniforms-uTreble-value': audio.treble,
    'uniforms-uLevel-value': audio.level,
    'uniforms-uBeat-value': audio.beat,
    'uniforms-uTravel-value': getBassTravel(analysis, time),
    'uniforms-uSpectrum-value': getSpectrum(analysis, time, BAND_COUNT),
    'uniforms-uGlow-value': glow,
    'uniforms-uHueStart-value': hueStart,
    'uniforms-uHueEnd-value': hueEnd,
    'uniforms-uSize-value': size,
    'uniforms-uScale-value': scale,
    'uniforms-uOpacity-value': opacity,
  };
  for (const [name, value] of Object.entries(uniforms)) {
    live[`uniforms-${name}-value`] = value;
  }

  const geometry = (
    <bufferGeometry>
      {lines ? <bufferAttribute attach="index" args={[lines, 1]} /> : null}
      <bufferAttribute attach="attributes-position" args={[base ?? zeros, 3]} />
      <bufferAttribute attach="attributes-aSeed" args={[seeds.a, 4]} />
      <bufferAttribute attach="attributes-aSeed2" args={[seeds.b, 4]} />
    </bufferGeometry>
  );

  return isLines ? (
    <lineSegments frustumCulled={false}>
      {geometry}
      <shaderMaterial args={[material]} {...live} />
    </lineSegments>
  ) : (
    <points frustumCulled={false}>
      {geometry}
      <shaderMaterial args={[material]} {...live} />
    </points>
  );
};
