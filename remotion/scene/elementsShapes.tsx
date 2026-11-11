// More elements made of glowing points and lines: a tunnel, a helix, a
// spiral galaxy, a spiked orb, rippling rings, an aurora curtain, fireflies
// and falling "code rain". Same rules as everywhere: each one is a pure
// function of (params, audio, time); anything random comes from a fixed seed.
//
// The big clouds (helix, galaxy, orb, aurora) are animated on the graphics
// card through GpuCloud; the ones with only a few thousand points or lines
// are computed here in JavaScript.

import React, {useMemo} from 'react';
import {BAND_COUNT, getBassTravel, getSpectrum} from '../audio/analysis';
import type {ElementProps} from './elements';
import {GlowLines, GlowPoints, levelAt, writeColor} from './elementsDense';
import {seededRandom} from './elementsExtra';
import {GpuCloud} from './gpuCloud';

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

// aSeed: position along the helix, then three numbers for the fuzz.
const HELIX_BODY = /* glsl */ `
  float along = aSeed.x;
  float strand = floor(aSeed2.x * uStrands);
  float level = levelAt(along);
  float angle = along * uTurns * TAU + uSpin + strand / uStrands * TAU;
  float r = uRadius * (1.0 + level * uBump);

  p = vec3(
    cos(angle) * r + (aSeed.y - 0.5) * uFuzz,
    (along - 0.5) * uLength + (aSeed.z - 0.5) * uFuzz,
    sin(angle) * r + (aSeed.w - 0.5) * uFuzz
  );
  c = hsl(mix(uHueStart, uHueEnd, strand / max(1.0, uStrands - 1.0)), 0.95, 0.55) * (0.5 + level * 1.2) * uGlow;
`;

/**
 * Strands of particles winding around the Y axis like a DNA double helix,
 * slowly turning. The strands swell where their part of the spectrum is
 * loud, and optional rungs connect two strands.
 */
const Helix: React.FC<ElementProps> = (props) => {
  const {params, analysis, time} = props;
  const strands = Math.round(num(params, 'strands'));
  const length = num(params, 'length');
  const radius = num(params, 'radius');
  const turns = num(params, 'turns');
  const bump = num(params, 'bump');
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');
  const spin = time * num(params, 'spin');

  // Rungs between the first two strands, like the steps of a ladder. Only a
  // few dozen lines, so they are computed here.
  const spectrum = getSpectrum(analysis, time, BAND_COUNT);
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
      <GpuCloud
        element={props}
        count={Math.round(num(params, 'count'))}
        seed={77}
        body={HELIX_BODY}
        uniforms={{
          uStrands: strands,
          uLength: length,
          uRadius: radius,
          uTurns: turns,
          uSpin: spin,
          uBump: bump,
          uFuzz: num(params, 'fuzz'),
        }}
        hueStart={hueStart}
        hueEnd={hueEnd}
        glow={glow}
        size={num(params, 'pointSize')}
      />
      {rungCount > 0 ? <GlowLines positions={rungPositions} colors={rungColors} /> : null}
    </>
  );
};

// ----------------------------------------------------------------------- Galaxy

// aSeed: distance from the centre, two numbers for straying from the arm,
// height. aSeed2.x: which arm.
const GALAXY_BODY = /* glsl */ `
  float reach = pow(aSeed.x, 0.8);
  float level = levelAt(reach * 0.85);
  // How far the particle strays from the centre line of its arm; two random
  // numbers averaged gather most of them near the line.
  float stray = (aSeed.y + aSeed.z - 1.0) * uSpread * (0.4 + reach);
  float arm = floor(aSeed2.x * uArms);
  float angle = arm / uArms * TAU + reach * uTwist + stray + uSwirl * (1.5 - reach);
  float dist = (0.03 + reach) * uRadius * uBreathe;
  // Thicker in the middle (the bulge), thin at the rim.
  float bulge = uThickness * (0.25 + (1.0 - reach) * 0.75) * (0.6 + level * 1.4);

  p = vec3(cos(angle) * dist, (aSeed.w - 0.5) * 2.0 * bulge, sin(angle) * dist);
  c = hsl(mix(uHueStart, uHueEnd, reach), 0.95, 0.55) * (0.45 + level * 1.1) * (1.5 - reach * 0.9) * uGlow;
`;

/**
 * A spiral galaxy in the XZ plane: particles gathered into arms that wind
 * outward from a bright, thick centre. It turns slowly (faster inside) and
 * its arms puff up with the spectrum.
 */
const Galaxy: React.FC<ElementProps> = (props) => {
  const {params, audio, time} = props;
  return (
    <GpuCloud
      element={props}
      count={Math.round(num(params, 'count'))}
      seed={909}
      body={GALAXY_BODY}
      uniforms={{
        uArms: Math.round(num(params, 'arms')),
        uRadius: num(params, 'radius'),
        uTwist: num(params, 'twist'),
        uSpread: num(params, 'spread'),
        uThickness: num(params, 'thickness'),
        uSwirl: time * num(params, 'swirl'),
        uBreathe: 1 + num(params, 'pulse') * (audio.bass * 0.1 + audio.beat * 0.05),
      }}
      hueStart={num(params, 'hueStart')}
      hueEnd={num(params, 'hueEnd')}
      glow={num(params, 'glow')}
      size={num(params, 'pointSize')}
    />
  );
};

// -------------------------------------------------------------------- Spike Orb

const ORB_FUNCTIONS = /* glsl */ `
  // 0 on most of the surface, rising to 1 in separate round spots.
  float spots(vec3 n, float scale, float shift) {
    return max(0.0, sin(n.x * scale + shift) * sin(n.y * scale - shift * 0.7) * sin(n.z * scale + shift * 1.3));
  }
`;

// `position` holds the point's direction on the unit sphere.
const ORB_BODY = /* glsl */ `
  vec3 n = position;
  // The small constants keep a few low spikes moving even in silence.
  float lift =
    (0.12 + uBass) * spots(n, 2.2 * uDetail, uPhase) * 1.6 +
    (0.06 + uMid) * spots(n, 4.1 * uDetail, -uPhase * 1.4) * 1.3 +
    uTreble * spots(n, 7.3 * uDetail, uPhase * 2.1);

  p = n * (uRadius * (1.0 + uBass * 0.06) + lift * uSpikes);
  float tip = min(1.0, lift * 1.2);
  c = hsl(mix(uHueStart, uHueEnd, tip), 0.95, 0.45 + tip * 0.2) * (0.45 + tip * 1.3) * uGlow;
`;

/**
 * A sphere of points whose surface throws up moving spikes, like a magnetic
 * liquid. Three patterns of spikes drift over it - broad ones raised by the
 * bass, finer ones by the mids and the highs.
 */
const SpikeOrb: React.FC<ElementProps> = (props) => {
  const {params, analysis, time} = props;
  const count = Math.round(num(params, 'count'));
  const flow = num(params, 'flow');

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

  return (
    <GpuCloud
      element={props}
      count={count}
      seed={3}
      base={normals}
      functions={ORB_FUNCTIONS}
      body={ORB_BODY}
      uniforms={{
        uRadius: num(params, 'radius'),
        uSpikes: num(params, 'spikes'),
        uDetail: num(params, 'detail'),
        uPhase: time * flow + getBassTravel(analysis, time) * flow * 0.5,
      }}
      hueStart={num(params, 'hueStart')}
      hueEnd={num(params, 'hueEnd')}
      glow={num(params, 'glow')}
      size={num(params, 'pointSize')}
    />
  );
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

// `position.x` is the column's place across the curtain (0..1), `position.y`
// how far up its column the point sits (0..1).
const AURORA_BODY = /* glsl */ `
  float across = position.x;
  float up = position.y;
  float x = (across - 0.5) * uWidth;
  float z = sin(x * 0.4 + uPhase) * uDepth + sin(x * 1.1 - uPhase * 1.3) * uDepth * 0.4;
  float level = levelAt(across * 0.9);
  float tall = uHeight * (0.55 + level * 0.75);

  p = vec3(x, up * tall, z + up * uDepth * 0.3 * sin(x * 0.7 + uPhase * 0.6));
  // Brightest just above the foot, fading out toward the top.
  float shine = (1.0 - up) * min(1.0, up * 6.0 + 0.25);
  c = hsl(mix(uHueStart, uHueEnd, across) + up * 30.0, 0.95, 0.55) * shine * (0.55 + level * 1.2) * uGlow;
`;

/**
 * A curtain of light, like the northern lights: columns of points standing
 * along X on a slowly waving line, each column as tall as its part of the
 * spectrum is loud, fading out toward the top.
 */
const Aurora: React.FC<ElementProps> = (props) => {
  const {params, time} = props;
  const columns = Math.round(num(params, 'columns'));
  const rows = Math.round(num(params, 'rows'));

  const base = useMemo(() => {
    const random = seededRandom(31);
    const out = new Float32Array(columns * rows * 3);
    for (let c = 0; c < columns; c++) {
      for (let r = 0; r < rows; r++) {
        const i = (c * rows + r) * 3;
        out[i] = c / Math.max(1, columns - 1);
        // Random heights within the column, so it reads as light, not as dots in rows.
        out[i + 1] = (r + random()) / rows;
      }
    }
    return out;
  }, [columns, rows]);

  return (
    <GpuCloud
      element={props}
      count={columns * rows}
      seed={31}
      base={base}
      body={AURORA_BODY}
      uniforms={{
        uWidth: num(params, 'width'),
        uHeight: num(params, 'height'),
        uDepth: num(params, 'depth'),
        uPhase: time * num(params, 'flow'),
      }}
      hueStart={num(params, 'hueStart')}
      hueEnd={num(params, 'hueEnd')}
      glow={num(params, 'glow')}
      size={num(params, 'pointSize')}
    />
  );
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

// aSeed: column x, column z, fall speed, start offset. `position.x` is the
// drop's place in its trail (0 = head).
const RAIN_BODY = /* glsl */ `
  float k = position.x;
  float level = levelAt(aSeed.x);
  float loop = uHeight + uTrail * uStep;
  float head = uHeight / 2.0 - mod(uFallen * (0.5 + aSeed.z) + aSeed.w * loop, loop);
  float y = head + k * uStep;
  float fade = 1.0 - k / uTrail;
  float visible = step(-uHeight / 2.0, y) * step(y, uHeight / 2.0);

  p = vec3((aSeed.x - 0.5) * uWidth, y, (aSeed.y - 0.5) * uDepth);
  // The head is nearly white, the trail takes the element's colour.
  bool isHead = k < 0.5;
  c = hsl(uHueStart, 0.95, isHead ? 0.85 : 0.5)
    * visible * pow(fade, 1.4) * (0.7 + level * 1.5) * (isHead ? 1.8 : 1.0) * uGlow;
`;

/**
 * Columns of light falling like rain on a screen, each with a bright head
 * and a fading trail, spread over some depth. A column falls at its own
 * speed and shines brighter when its part of the spectrum is loud.
 */
const DigitalRain: React.FC<ElementProps> = (props) => {
  const {params, time} = props;
  const columns = Math.round(num(params, 'columns'));
  const trail = Math.round(num(params, 'trail'));
  const height = num(params, 'height');

  // Every drop of a column shares the column's random numbers and only
  // differs in its place along the trail.
  const base = useMemo(() => {
    const out = new Float32Array(columns * trail * 3);
    for (let i = 0; i < columns * trail; i++) out[i * 3] = i % trail;
    return out;
  }, [columns, trail]);

  return (
    <GpuCloud
      element={props}
      count={columns * trail}
      seed={2077}
      seedEvery={trail}
      base={base}
      body={RAIN_BODY}
      uniforms={{
        uWidth: num(params, 'width'),
        uHeight: height,
        uDepth: num(params, 'depth'),
        uTrail: trail,
        // Drops are this far apart along a trail.
        uStep: height / 48,
        uFallen: time * num(params, 'speed'),
      }}
      hueStart={num(params, 'hue')}
      hueEnd={num(params, 'hue')}
      glow={num(params, 'glow')}
      size={num(params, 'pointSize')}
    />
  );
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
