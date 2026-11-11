// The React Three Fiber component behind every element type. Each one draws
// around its own origin; position, rotation and scale are applied by the
// SceneRenderer. Everything here is a pure function of (params, audio, time)
// - no state, no clocks - so a frame always renders the same way.

import React, {useMemo} from 'react';
import {Grid, Line, Stars as DreiStars} from '@react-three/drei';
import {useThree} from '@react-three/fiber';
import {
  getSpectrum,
  type AudioFrame,
  type TrackAnalysis,
} from '../audio/analysis';
import type {Params} from './definitions';

export type ElementProps = {
  params: Params;
  analysis: TrackAnalysis;
  /** Bass / mid / treble / level / beat right now. */
  audio: AudioFrame;
  /** Seconds since the start of the track. */
  time: number;
  /** Turns the storage key of an uploaded file into a URL that can be loaded. */
  assetUrl: (key: string) => string;
  /** Address of the folder the text fonts are loaded from. */
  fontBase: string;
};

/**
 * Line widths are given in screen pixels, so a line would look three times
 * thinner in a 4K export than in the 720p preview. This scales a width
 * given for a 720p picture to the size actually being drawn.
 */
function useLineScale() {
  return useThree((state) => state.size.height) / 720;
}

const num = (params: Params, key: string) => Number(params[key]);
const hsl = (hue: number, saturation: number, lightness: number) =>
  `hsl(${((hue % 360) + 360) % 360}, ${saturation}%, ${lightness}%)`;

/** Ring of bars, one per frequency band, growing upward from the origin. */
const BarRing: React.FC<ElementProps> = ({params, analysis, time}) => {
  const count = Math.round(num(params, 'count'));
  const radius = num(params, 'radius');
  const width = num(params, 'barWidth');
  const heightScale = num(params, 'height');
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');
  const spin = num(params, 'spin');

  const spectrum = getSpectrum(analysis, time, count);

  return (
    <>
      {spectrum.map((level, i) => {
        const angle = (i / count) * Math.PI * 2 + time * spin;
        const height = 0.15 + level * heightScale;
        const hue = hueStart + (i / count) * (hueEnd - hueStart);

        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              height / 2,
              Math.sin(angle) * radius,
            ]}
            scale={[width, height, width]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={hsl(hue, 90, 55)}
              emissive={hsl(hue, 100, 55)}
              emissiveIntensity={(0.8 + level * 3.2) * glow}
              roughness={0.35}
              metalness={0.4}
            />
          </mesh>
        );
      })}
    </>
  );
};

/** Evenly distributes `count` points across a unit sphere (Fibonacci lattice). */
function fibonacciSpherePoints(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    points.push([Math.cos(theta) * radiusAtY, y, Math.sin(theta) * radiusAtY]);
  }

  return points;
}

/** Particles on a sphere, each pushed outward by one frequency band. */
const SphereSwarm: React.FC<ElementProps> = ({params, analysis, time}) => {
  const count = Math.round(num(params, 'count'));
  const radius = num(params, 'radius');
  const size = num(params, 'size');
  const push = num(params, 'push');
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const glow = num(params, 'glow');
  const wobble = num(params, 'wobble');

  const lineScale = useLineScale();
  const basePoints = useMemo(() => fibonacciSpherePoints(count), [count]);
  const spectrum = getSpectrum(analysis, time, count);

  const points = basePoints.map(([x, y, z], i) => {
    const distance =
      radius +
      spectrum[i] * push +
      Math.sin(time * 1.5 + i) * 0.05 * radius * wobble;
    return [x * distance, y * distance, z * distance] as [
      number,
      number,
      number,
    ];
  });

  return (
    <>
      {params.thread ? (
        <Line
          points={[...points, points[0]]}
          color={hsl((hueStart + hueEnd) / 2, 90, 70)}
          lineWidth={lineScale}
          transparent
          opacity={0.35}
        />
      ) : null}

      {points.map((position, i) => {
        const level = spectrum[i];
        const hue = hueStart + (i / count) * (hueEnd - hueStart);

        return (
          <mesh
            key={i}
            position={position}
            scale={0.08 + size * 0.4 + level * 0.18}
          >
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial
              color={hsl(hue, 90, 62)}
              emissive={hsl(hue, 100, 60)}
              emissiveIntensity={(1 + level * 3) * glow}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
        );
      })}
    </>
  );
};

/**
 * Rows of spectrum lines receding along -Z. Each row shows the spectrum a
 * little earlier than the one in front of it, so the sound's recent history
 * reads as a landscape scrolling toward the viewer.
 */
const TerrainLines: React.FC<ElementProps> = ({params, analysis, time}) => {
  const rows = Math.round(num(params, 'rows'));
  const points = Math.round(num(params, 'points'));
  const width = num(params, 'width');
  const spacing = num(params, 'spacing');
  const heightScale = num(params, 'height');
  const delay = num(params, 'delay');
  const lineWidth = num(params, 'lineWidth') * useLineScale();
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');

  const nearEdge = (rows * spacing) / 2;

  return (
    <>
      {new Array(rows).fill(0).map((_, row) => {
        const spectrum = getSpectrum(
          analysis,
          Math.max(0, time - row * delay),
          points,
        );
        const z = nearEdge - row * spacing;
        const line = spectrum.map(
          (level, i) =>
            [(i / (points - 1) - 0.5) * width, level * heightScale, z] as [
              number,
              number,
              number,
            ],
        );
        const nearness = 1 - row / rows;

        return (
          <Line
            key={row}
            points={line}
            color={hsl(
              hueStart + nearness * (hueEnd - hueStart),
              95,
              55 + nearness * 25,
            )}
            lineWidth={lineWidth}
            transparent
            opacity={0.3 + nearness * 0.7}
          />
        );
      })}
    </>
  );
};

/** A bright sphere that breathes with the bass, kicks on the beat and casts light. */
const Core: React.FC<ElementProps> = ({params, audio}) => {
  const radius = num(params, 'radius');
  const hue = num(params, 'hue');
  const pulse = num(params, 'pulse');
  const light = num(params, 'light');

  return (
    <>
      <mesh scale={radius * (1 + pulse * (audio.bass * 0.25 + audio.beat * 0.35))}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={hsl(hue, 95, 65)} />
      </mesh>
      <pointLight
        color={hsl(hue, 95, 60)}
        intensity={light + pulse * audio.beat * 4}
        distance={radius * 17}
      />
    </>
  );
};

/** A flat disc of light lying on the floor (XZ plane). */
const GlowDisc: React.FC<ElementProps> = ({params, audio}) => {
  const pulse = num(params, 'pulse');
  const opacity =
    num(params, 'opacity') + pulse * (audio.bass * 0.1 + audio.beat * 0.2);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[num(params, 'radius'), 48]} />
      <meshBasicMaterial
        color={hsl(num(params, 'hue'), 90, 55)}
        transparent
        opacity={Math.min(1, opacity)}
      />
    </mesh>
  );
};

/** An upright glowing disc facing +Z. Not affected by fog, so it works on a far horizon. */
const Sun: React.FC<ElementProps> = ({params, audio}) => {
  return (
    <mesh scale={1 + num(params, 'pulse') * audio.beat * 0.06}>
      <circleGeometry args={[num(params, 'radius'), 48]} />
      <meshBasicMaterial color={hsl(num(params, 'hue'), 95, 62)} fog={false} />
    </mesh>
  );
};

/** An endless grid on the XZ plane. */
const GridFloor: React.FC<ElementProps> = ({params}) => {
  const hue = num(params, 'hue');
  const fade = num(params, 'fade');

  return (
    <Grid
      args={[fade, fade]}
      cellSize={num(params, 'cell')}
      cellThickness={0.6}
      cellColor={hsl(hue, 38, 16)}
      sectionSize={num(params, 'section')}
      sectionThickness={1.2}
      sectionColor={hsl(hue, 100, 62)}
      fadeDistance={fade}
      fadeStrength={2}
      infiniteGrid
    />
  );
};

/** A starfield around the scene. `speed={0}` keeps it still, so it renders the same on every machine. */
const Stars: React.FC<ElementProps> = ({params}) => {
  return (
    <DreiStars
      radius={num(params, 'spread')}
      depth={num(params, 'depth')}
      count={Math.round(num(params, 'count'))}
      factor={num(params, 'size')}
      saturation={0}
      fade
      speed={0}
    />
  );
};

export const BASE_ELEMENT_COMPONENTS = {
  barRing: BarRing,
  sphereSwarm: SphereSwarm,
  terrainLines: TerrainLines,
  core: Core,
  glowDisc: GlowDisc,
  sun: Sun,
  gridFloor: GridFloor,
  stars: Stars,
};
