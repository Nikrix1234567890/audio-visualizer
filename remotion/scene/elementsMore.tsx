// A third family of elements: vortex, resonance plate, pendulum wave,
// hypercube, LED wall, radar, corona, sunflower, torus knot and jellyfish.
//
// Big clouds run on the graphics card through GpuCloud (see ./gpuCloud.tsx);
// the few made of a handful of lines are computed here. As everywhere:
// pure functions of (params, audio, time), randomness from fixed seeds.

import React, {useMemo} from 'react';
import {BAND_COUNT, getBassTravel, getSpectrum} from '../audio/analysis';
import type {ElementProps} from './elements';
import {GlowLines, GlowPoints, levelAt, writeColor} from './elementsDense';
import {seededRandom} from './elementsExtra';
import {GpuCloud} from './gpuCloud';

const num = (params: ElementProps['params'], key: string) => Number(params[key]);
const TWO_PI = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;

/** The usual colour and size settings every cloud element passes on. */
const look = (params: ElementProps['params']) => ({
  hueStart: num(params, 'hueStart'),
  hueEnd: num(params, 'hueEnd'),
  glow: num(params, 'glow'),
  size: num(params, 'pointSize'),
});

// ----------------------------------------------------------------------- Vortex

// aSeed: starting distance from the centre, angle, drift speed, height jitter.
const VORTEX_BODY = /* glsl */ `
  // Every particle slowly spirals inward and starts again at the rim.
  float reach = fract(aSeed.x - uInflow * (0.4 + aSeed.z));
  float level = levelAt(reach * 0.85);
  // The closer to the centre, the faster it circles.
  float angle = aSeed.y * TAU + uSwirl / (0.18 + reach);
  float r = reach * uRadius;
  // A funnel: flat at the rim, plunging down in the middle.
  float y = -uDepth * (1.0 / (reach * 5.0 + 0.55) - 0.18) + (aSeed.w - 0.5) * (0.1 + level * 0.8);

  p = vec3(cos(angle) * r, y, sin(angle) * r);
  // Fading at both ends hides the jump from the centre back to the rim.
  float fade = smoothstep(0.0, 0.08, reach) * smoothstep(1.0, 0.8, reach);
  c = hsl(mix(uHueEnd, uHueStart, reach), 0.95, 0.55) * fade * (0.35 + level + (1.0 - reach) * 0.8) * uGlow;
`;

/**
 * Particles circling down a funnel, like water down a drain or matter into
 * a black hole: slow at the rim, fast in the middle. They speed up with
 * the bass and the stream thickens where the spectrum is loud.
 */
const Vortex: React.FC<ElementProps> = (props) => {
  const {params, analysis, time} = props;
  const swirl = num(params, 'swirl');
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={11}
      body={VORTEX_BODY}
      uniforms={{
        uRadius: num(params, 'radius'),
        uDepth: num(params, 'depth'),
        uSwirl: time * swirl + getBassTravel(analysis, time) * swirl * 0.5,
        uInflow: time * num(params, 'inflow'),
      }}
      {...look(params)}
    />
  );
};

// -------------------------------------------------------------- Resonance Plate

/** Pairs of whole numbers that give clearly different, good-looking figures. */
const PLATE_MODES = [
  [1, 2], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [1, 6], [4, 5], [2, 7], [3, 6], [5, 6], [4, 7],
];

const PLATE_FUNCTIONS = /* glsl */ `
  // The standing-wave pattern of a square plate for one pair of numbers:
  // zero along the lines where sand would collect.
  float figure(vec2 at, vec2 mode) {
    return cos(mode.x * 3.14159 * at.x) * cos(mode.y * 3.14159 * at.y)
         - cos(mode.y * 3.14159 * at.x) * cos(mode.x * 3.14159 * at.y);
  }
`;

// `position` holds the grid point as x and z in -1..1.
const PLATE_BODY = /* glsl */ `
  vec2 at = position.xz * 0.5 + 0.5;
  // Morphs from the previous figure to the current one after every beat.
  float pattern = mix(
    figure(at, vec2(uModeA1, uModeA2)),
    figure(at, vec2(uModeB1, uModeB2)),
    uBlend
  ) * 0.5;
  float quiet = 1.0 - min(1.0, abs(pattern) * 2.2);

  // Away from the quiet lines the grains are shaken about and thin out.
  vec2 shake = (aSeed.xy - 0.5) * abs(pattern) * uScatter;
  p = vec3(
    (position.x + shake.x) * uHalf,
    pattern * uHeight * (0.25 + uLevel * 1.5),
    (position.z + shake.y) * uHalf
  );
  c = hsl(mix(uHueStart, uHueEnd, quiet), 0.95, 0.5) * (0.07 + quiet * quiet * quiet * 2.4) * uGlow;
`;

/**
 * A vibrating plate strewn with grains that gather along the lines where it
 * stays still - the figures sound draws in sand. Every beat switches to a
 * new figure, and the grains flow from the old one into the new.
 */
const ResonancePlate: React.FC<ElementProps> = (props) => {
  const {params, audio} = props;
  const side = Math.round(num(params, 'resolution'));

  const base = useMemo(() => {
    const out = new Float32Array(side * side * 3);
    for (let z = 0; z < side; z++) {
      for (let x = 0; x < side; x++) {
        const i = (z * side + x) * 3;
        out[i] = (x / (side - 1)) * 2 - 1;
        out[i + 2] = (z / (side - 1)) * 2 - 1;
      }
    }
    return out;
  }, [side]);

  const current = PLATE_MODES[audio.beatCount % PLATE_MODES.length];
  const previous =
    PLATE_MODES[(audio.beatCount + PLATE_MODES.length - 1) % PLATE_MODES.length];
  // `beat` is 1 on the beat and fades: so right on the beat the old figure
  // still shows, and it turns into the new one as the beat dies away.
  const blend = 1 - audio.beat;

  return (
    <GpuCloud
      element={props}
      count={side * side}
      seed={64}
      base={base}
      functions={PLATE_FUNCTIONS}
      body={PLATE_BODY}
      uniforms={{
        uHalf: num(params, 'size') / 2,
        uHeight: num(params, 'height'),
        uScatter: num(params, 'scatter'),
        uModeA1: previous[0],
        uModeA2: previous[1],
        uModeB1: current[0],
        uModeB2: current[1],
        uBlend: blend * blend * (3 - 2 * blend),
      }}
      {...look(params)}
    />
  );
};

// ---------------------------------------------------------------- Pendulum Wave

/**
 * A row of pendulums, each a little faster than its neighbour, so together
 * they drift in and out of step and draw travelling waves. Each one swings
 * wider when its part of the spectrum is loud.
 */
const PendulumWave: React.FC<ElementProps> = ({params, analysis, time}) => {
  const count = Math.round(num(params, 'count'));
  const width = num(params, 'width');
  const length = num(params, 'length');
  const swing = num(params, 'swing') * DEG_TO_RAD;
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');

  const spectrum = getSpectrum(analysis, time, BAND_COUNT);
  const t = time * num(params, 'speed');

  const bobs = new Float32Array(count * 3);
  const bobColors = new Float32Array(count * 3);
  const strings = new Float32Array(count * 6);
  const stringColors = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const across = count > 1 ? i / (count - 1) : 0.5;
    const level = levelAt(spectrum, across * 0.9);
    const x = (across - 0.5) * width;
    const angle = swing * (0.35 + level) * Math.sin(t * TWO_PI * (0.5 + i * 0.02));
    const y = length / 2 - Math.cos(angle) * length;
    const z = Math.sin(angle) * length;
    const hue = hueStart + across * (hueEnd - hueStart);

    bobs.set([x, y, z], i * 3);
    writeColor(bobColors, i * 3, hue, 0.6, (0.6 + level * 1.2) * glow);
    strings.set([x, length / 2, 0, x, y, z], i * 6);
    writeColor(stringColors, i * 6, hue, 0.5, 0.12 * glow);
    writeColor(stringColors, i * 6 + 3, hue, 0.5, 0.6 * glow);
  }

  return (
    <>
      <GlowLines positions={strings} colors={stringColors} />
      <GlowPoints positions={bobs} colors={bobColors} size={num(params, 'pointSize')} />
    </>
  );
};

// -------------------------------------------------------------------- Hypercube

/**
 * A four-dimensional cube turning through 3D space: its inner and outer
 * cube keep swapping places. Sixteen corners, thirty-two edges; it swells
 * with the bass and its edges brighten with the level.
 */
const Hypercube: React.FC<ElementProps> = ({params, audio, time}) => {
  const size = num(params, 'size') * (1 + audio.bass * 0.15);
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');
  const t = time * num(params, 'speed');

  // Turn each corner in two 4D planes and one ordinary one, then project.
  const corners: {at: [number, number, number]; w: number}[] = [];
  for (let i = 0; i < 16; i++) {
    let x = i & 1 ? 1 : -1;
    let y = i & 2 ? 1 : -1;
    let z = i & 4 ? 1 : -1;
    let w = i & 8 ? 1 : -1;
    const turn = (a: number, b: number, angle: number): [number, number] => [
      a * Math.cos(angle) - b * Math.sin(angle),
      a * Math.sin(angle) + b * Math.cos(angle),
    ];
    [x, w] = turn(x, w, t);
    [y, w] = turn(y, w, t * 0.61);
    [x, z] = turn(x, z, t * 0.37);
    // Perspective from the fourth dimension: far in w looks small.
    const shrink = (2.4 / (3.4 - w)) * size;
    corners.push({at: [x * shrink, y * shrink, z * shrink], w});
  }

  const edges = new Float32Array(32 * 6);
  const edgeColors = new Float32Array(32 * 6);
  let edge = 0;
  for (let i = 0; i < 16; i++) {
    for (let bit = 0; bit < 4; bit++) {
      const j = i ^ (1 << bit);
      if (j < i) continue;
      for (const [end, corner] of [corners[i], corners[j]].entries()) {
        edges.set(corner.at, edge * 6 + end * 3);
        writeColor(
          edgeColors,
          edge * 6 + end * 3,
          hueStart + ((corner.w + 1) / 2) * (hueEnd - hueStart),
          0.6,
          (0.7 + audio.level * 1.6 + audio.beat * 0.6) * glow,
        );
      }
      edge++;
    }
  }

  const points = new Float32Array(16 * 3);
  const pointColors = new Float32Array(16 * 3);
  corners.forEach((corner, i) => {
    points.set(corner.at, i * 3);
    writeColor(pointColors, i * 3, hueStart + ((corner.w + 1) / 2) * (hueEnd - hueStart), 0.7, (0.8 + audio.beat) * glow);
  });

  return (
    <>
      <GlowLines positions={edges} colors={edgeColors} />
      <GlowPoints positions={points} colors={pointColors} size={num(params, 'pointSize')} />
    </>
  );
};

// --------------------------------------------------------------------- LED Wall

// `position.x` is the column (0..1 across), `position.y` the row (0..1 up).
const WALL_BODY = /* glsl */ `
  // Lifted a little, so quiet passages still fill part of the wall.
  float level = pow(levelAt(position.x * 0.9), 0.7);
  // Lit up to the column's level, with a soft top edge.
  float lit = smoothstep(level + 0.02, level - 0.02, position.y);
  p = vec3((position.x - 0.5) * uWidth, (position.y - 0.5) * uHeight, 0.0);
  c = hsl(mix(uHueStart, uHueEnd, position.y), 0.95, 0.5) * (0.07 + lit * 2.0) * uGlow;
`;

/**
 * A wall of lights showing the spectrum the classic way: one column per
 * frequency band, lit from the bottom as high as that band is loud.
 */
const LedWall: React.FC<ElementProps> = (props) => {
  const {params} = props;
  const columns = Math.round(num(params, 'columns'));
  const rows = Math.round(num(params, 'rows'));

  const base = useMemo(() => {
    const out = new Float32Array(columns * rows * 3);
    for (let c = 0; c < columns; c++) {
      for (let r = 0; r < rows; r++) {
        const i = (c * rows + r) * 3;
        out[i] = columns > 1 ? c / (columns - 1) : 0.5;
        out[i + 1] = (r + 0.5) / rows;
      }
    }
    return out;
  }, [columns, rows]);

  return (
    <GpuCloud
      element={props}
      count={columns * rows}
      seed={5}
      base={base}
      body={WALL_BODY}
      uniforms={{uWidth: num(params, 'width'), uHeight: num(params, 'height')}}
      {...look(params)}
    />
  );
};

// ------------------------------------------------------------------------ Radar

const RADAR_RINGS = 4;
const RADAR_SEGMENTS = 96;
const SWEEP_LINES = 70;

/**
 * A radar screen lying in the XZ plane: range rings, a sweeping beam with a
 * fading trail, and blips that flare up as the beam passes them - brighter
 * when their part of the spectrum is loud.
 */
const Radar: React.FC<ElementProps> = ({params, analysis, audio, time}) => {
  const radius = num(params, 'radius');
  const blips = Math.round(num(params, 'blips'));
  const hue = num(params, 'hue');
  const glow = num(params, 'glow');
  const sweep = time * num(params, 'speed');

  const seeds = useMemo(() => {
    const random = seededRandom(1984);
    const out = new Float32Array(blips * 2);
    for (let i = 0; i < out.length; i++) out[i] = random();
    return out;
  }, [blips]);
  const spectrum = getSpectrum(analysis, time, BAND_COUNT);

  const lineCount = RADAR_RINGS * RADAR_SEGMENTS + SWEEP_LINES + 4;
  const lines = new Float32Array(lineCount * 6);
  const lineColors = new Float32Array(lineCount * 6);
  let line = 0;
  const addLine = (from: [number, number], to: [number, number], bright: number, tip = bright) => {
    lines.set([from[0], 0, from[1], to[0], 0, to[1]], line * 6);
    writeColor(lineColors, line * 6, hue, 0.55, bright * glow);
    writeColor(lineColors, line * 6 + 3, hue, 0.55, tip * glow);
    line++;
  };

  for (let ring = 1; ring <= RADAR_RINGS; ring++) {
    const r = (ring / RADAR_RINGS) * radius;
    for (let i = 0; i < RADAR_SEGMENTS; i++) {
      const a = (i / RADAR_SEGMENTS) * TWO_PI;
      const b = ((i + 1) / RADAR_SEGMENTS) * TWO_PI;
      addLine([Math.cos(a) * r, Math.sin(a) * r], [Math.cos(b) * r, Math.sin(b) * r], 0.22 + audio.level * 0.3);
    }
  }
  // Cross hairs.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TWO_PI;
    addLine([0, 0], [Math.cos(a) * radius, Math.sin(a) * radius], 0.12);
  }
  // The beam and its trail: bright at the front, fading behind.
  for (let i = 0; i < SWEEP_LINES; i++) {
    const a = sweep - i * 0.018;
    const fade = 1 - i / SWEEP_LINES;
    addLine([0, 0], [Math.cos(a) * radius, Math.sin(a) * radius], 0.1 * fade, (i === 0 ? 1.6 : 0.5) * fade * fade);
  }

  const points = new Float32Array(blips * 3);
  const pointColors = new Float32Array(blips * 3);
  for (let i = 0; i < blips; i++) {
    const reach = Math.sqrt(seeds[i * 2]);
    const angle = seeds[i * 2 + 1] * TWO_PI;
    // How long ago the beam passed this blip, as a fraction of a full turn.
    const behind = ((((sweep - angle) % TWO_PI) + TWO_PI) % TWO_PI) / TWO_PI;
    const flare = Math.pow(1 - behind, 5);
    points.set([Math.cos(angle) * reach * radius, 0, Math.sin(angle) * reach * radius], i * 3);
    writeColor(pointColors, i * 3, hue, 0.7, flare * (0.9 + levelAt(spectrum, reach) * 2.6) * glow);
  }

  return (
    <>
      <GlowLines positions={lines} colors={lineColors} />
      <GlowPoints positions={points} colors={pointColors} size={num(params, 'pointSize')} />
    </>
  );
};

// ----------------------------------------------------------------------- Corona

// aSeed: direction (two numbers), flare start, flare speed. aSeed2.x decides
// whether the point belongs to the surface or to a flare.
const CORONA_BODY = /* glsl */ `
  float up = 1.0 - 2.0 * aSeed.x;
  float ring = sqrt(max(0.0, 1.0 - up * up));
  vec3 n = vec3(cos(aSeed.y * TAU) * ring, up, sin(aSeed.y * TAU) * ring);
  float level = levelAt(aSeed2.y * 0.9);

  if (aSeed2.x < 0.35) {
    // The surface: a shimmering shell.
    float shimmer = 0.5 + 0.5 * sin(uTime * (1.0 + aSeed.w * 3.0) + aSeed.z * TAU);
    p = n * uRadius * (1.0 + uBass * 0.08 + shimmer * 0.03);
    c = hsl(uHueStart, 0.95, 0.6) * (0.5 + shimmer * 0.5 + uLevel) * uGlow;
  } else {
    // A flare: streams outward, fading, then starts again at the surface.
    float gone = fract(aSeed.z + uFlow * (0.4 + aSeed.w));
    float flown = gone * uReach * (0.6 + level * 1.6);
    p = n * (uRadius + flown);
    c = hsl(mix(uHueStart, uHueEnd, gone), 0.95, 0.55) * pow(1.0 - gone, 1.3) * (0.7 + level * 1.6) * uGlow;
  }
`;

/**
 * A star: a shimmering sphere of light whose surface throws out streams of
 * particles. The flares reach further where the spectrum is loud, and the
 * whole star swells with the bass.
 */
const Corona: React.FC<ElementProps> = (props) => {
  const {params, analysis, time} = props;
  const speed = num(params, 'speed');
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={2001}
      body={CORONA_BODY}
      uniforms={{
        uRadius: num(params, 'radius'),
        uReach: num(params, 'reach'),
        uFlow: time * speed + getBassTravel(analysis, time) * speed,
      }}
      {...look(params)}
    />
  );
};

// -------------------------------------------------------------------- Sunflower

// `position.x` is the seed's number, from 0 (centre) to 1 (rim).
const SUNFLOWER_BODY = /* glsl */ `
  float index = position.x * uCount;
  // Each seed sits a golden angle further round than the last - the
  // arrangement that packs a sunflower head.
  float angle = index * 2.39996323 + uSpin;
  float r = sqrt(position.x) * uRadius * (1.0 + uBass * 0.08);
  float level = levelAt(position.x * 0.85);
  // A wave runs outward from the centre and lifts the seeds.
  float lift = 0.5 + 0.5 * sin(position.x * 14.0 - uPhase);

  p = vec3(cos(angle) * r, level * uHeight * lift, sin(angle) * r);
  size = uSize * (0.45 + position.x * 0.9);
  c = hsl(mix(uHueStart, uHueEnd, position.x), 0.95, 0.55) * (0.55 + level * lift * 2.0) * uGlow;
`;

/**
 * Dots arranged like the seeds of a sunflower head, in spirals that seem to
 * turn both ways at once. Waves of the spectrum travel outward from the
 * centre and lift the seeds as they pass.
 */
const Sunflower: React.FC<ElementProps> = (props) => {
  const {params, analysis, time} = props;
  const count = Math.round(num(params, 'count'));
  const flow = num(params, 'flow');

  const base = useMemo(() => {
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) out[i * 3] = (i + 0.5) / count;
    return out;
  }, [count]);

  return (
    <GpuCloud
      element={props}
      count={count}
      seed={8}
      base={base}
      body={SUNFLOWER_BODY}
      uniforms={{
        uCount: count,
        uRadius: num(params, 'radius'),
        uHeight: num(params, 'height'),
        uSpin: time * num(params, 'spin'),
        uPhase: time * flow + getBassTravel(analysis, time) * flow,
      }}
      {...look(params)}
    />
  );
};

// ------------------------------------------------------------------- Torus Knot

// aSeed: position along the knot, then three numbers for the fuzz.
const KNOT_BODY = /* glsl */ `
  float along = fract(aSeed.x + uFlow);
  float t = along * TAU;
  float level = levelAt(aSeed.x);
  // A cord wound uP times round the ring and uQ times through its hole.
  float r = cos(uQ * t) + 2.0;
  vec3 at = vec3(r * cos(uP * t), -sin(uQ * t), r * sin(uP * t));
  vec3 fuzz = (aSeed.yzw - 0.5) * uFuzz * (0.4 + level * 1.6);

  p = at * uKnotSize + fuzz;
  c = hsl(mix(uHueStart, uHueEnd, 0.5 + 0.5 * sin(t * 2.0)), 0.95, 0.55) * (0.4 + level * 1.3) * uGlow;
`;

/**
 * A knotted loop of particles - one cord wound around a ring and through
 * its hole. The particles stream along the cord, and it frays into a cloud
 * where the spectrum is loud.
 */
const TorusKnot: React.FC<ElementProps> = (props) => {
  const {params, analysis, time} = props;
  const flow = num(params, 'flow');
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={23}
      body={KNOT_BODY}
      uniforms={{
        uKnotSize: num(params, 'size'),
        uP: Math.round(num(params, 'windings')),
        uQ: Math.round(num(params, 'loops')),
        uFuzz: num(params, 'fuzz'),
        uFlow: time * flow + getBassTravel(analysis, time) * flow * 0.5,
      }}
      {...look(params)}
    />
  );
};

// -------------------------------------------------------------------- Jellyfish

// aSeed2.x decides between bell and tentacle. Bell: aSeed.x from top to rim,
// aSeed.y around. Tentacle: aSeed.x which one, aSeed.y how far down.
const JELLYFISH_BODY = /* glsl */ `
  // The bell contracts and relaxes; a wave of it runs from top to rim.
  if (aSeed2.x < 0.5) {
    float down = sqrt(aSeed.x);
    float squeeze = 0.5 + 0.5 * sin(uPhase - down * 2.2);
    float around = aSeed.y * TAU;
    float r = uRadius * sin(down * 1.5708) * (1.0 - 0.22 * squeeze * down);
    float level = levelAt(aSeed.y);

    p = vec3(cos(around) * r, uRadius * 0.85 * cos(down * 1.5708) + squeeze * 0.15 * uRadius, sin(around) * r);
    // The rim glows; ribs of light run down the bell.
    float rib = 0.6 + 0.4 * sin(around * 8.0);
    c = hsl(mix(uHueStart, uHueEnd, down), 0.95, 0.55) * (0.25 + down * 0.6 + level * 0.9) * rib * uGlow;
  } else {
    float strand = floor(aSeed.x * uTentacles);
    float down = aSeed.y;
    float around = strand / uTentacles * TAU + strand * 2.4;
    float root = uRadius * (0.25 + 0.6 * fract(strand * 0.618));
    float sway = down * uRadius * 0.45;
    float level = levelAt(down);

    p = vec3(
      cos(around) * root + sin(down * 5.0 - uPhase + strand) * sway,
      -down * uLength,
      sin(around) * root + cos(down * 4.3 - uPhase * 0.8 + strand * 1.7) * sway
    ) + (aSeed.zwz - 0.5) * 0.12;
    c = hsl(mix(uHueEnd, uHueStart, down), 0.95, 0.55) * (1.0 - down) * (0.3 + level * 1.2) * uGlow;
  }
`;

/**
 * A jellyfish of light: a bell that pulses in a slow rhythm (faster with
 * the bass) and trailing tentacles that sway behind it.
 */
const Jellyfish: React.FC<ElementProps> = (props) => {
  const {params, analysis, time} = props;
  const speed = num(params, 'speed');
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={404}
      body={JELLYFISH_BODY}
      uniforms={{
        uRadius: num(params, 'radius'),
        uLength: num(params, 'length'),
        uTentacles: Math.round(num(params, 'tentacles')),
        uPhase: time * speed + getBassTravel(analysis, time) * speed * 1.5,
      }}
      {...look(params)}
    />
  );
};

export const MORE_ELEMENT_COMPONENTS = {
  vortex: Vortex,
  resonancePlate: ResonancePlate,
  pendulumWave: PendulumWave,
  hypercube: Hypercube,
  ledWall: LedWall,
  radar: Radar,
  corona: Corona,
  sunflower: Sunflower,
  torusKnot: TorusKnot,
  jellyfish: Jellyfish,
};
