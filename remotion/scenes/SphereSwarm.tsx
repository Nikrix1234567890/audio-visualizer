import React, {useMemo} from 'react';
import {Line} from '@react-three/drei';
import {getAudioFrame, getSpectrum} from '../audio/analysis';
import type {SceneProps} from './types';
import {PostFX} from './PostFX';

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

/**
 * A swarm of particles distributed over a sphere, each one pushed outward
 * along its own normal by one frequency bin - like a pulsating audio-reactive
 * sun/urchin. A single thread wired through the lattice in index order
 * traces a flowing conduit across the whole structure, and a soft inner
 * core sells the "energy source" read even before bloom is added.
 */
export const SphereSwarm: React.FC<SceneProps> = ({
  analysis,
  frame,
  fps,
  settings,
}) => {
  const {barCount, radius, barWidth, heightScale, hueStart, hueEnd} = settings;

  const basePoints = useMemo(() => fibonacciSpherePoints(barCount), [barCount]);

  const time = frame / fps;
  const spectrum = getSpectrum(analysis, time, barCount);
  const {bass, beat} = getAudioFrame(analysis, time);
  // The core breathes with the bass and kicks outward on every beat.
  const coreScale = 1 + bass * 0.25 + beat * 0.35;

  const displacedPoints = basePoints.map(([nx, ny, nz], i) => {
    const compressed = spectrum[i] ?? 0;
    const displacement = radius + compressed * heightScale * 1.4;
    const wobble = Math.sin(time * 1.5 + i) * 0.05 * radius;
    const d = displacement + wobble;
    return [nx * d, ny * d, nz * d] as [number, number, number];
  });

  const threadPoints = [...displacedPoints, displacedPoints[0]];
  const midHue = (hueStart + hueEnd) / 2;

  return (
    <>
      {/* Glowing core - the "energy source" the swarm orbits. */}
      <mesh scale={coreScale}>
        <sphereGeometry args={[radius * 0.35, 24, 24]} />
        <meshBasicMaterial color={`hsl(${midHue % 360}, 95%, 65%)`} />
      </mesh>
      <pointLight
        color={`hsl(${midHue % 360}, 95%, 60%)`}
        intensity={3 + beat * 4}
        distance={radius * 6}
      />

      <Line
        points={threadPoints}
        color={`hsl(${midHue % 360}, 90%, 70%)`}
        lineWidth={1}
        transparent
        opacity={0.35}
      />

      {displacedPoints.map(([x, y, z], i) => {
        const compressed = spectrum[i] ?? 0;
        const hue = (hueStart + (i / barCount) * (hueEnd - hueStart)) % 360;
        const size = 0.08 + barWidth * 0.4 + compressed * 0.18;

        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[size, 10, 10]} />
            <meshStandardMaterial
              color={`hsl(${hue}, 90%, 62%)`}
              emissive={`hsl(${hue}, 100%, 60%)`}
              emissiveIntensity={1 + compressed * 3}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
        );
      })}
      <PostFX />
    </>
  );
};

export function sphereSwarmCameraPosition(
  frame: number,
  fps: number,
  radius: number,
  cameraSpeed: number,
): [number, number, number] {
  const time = frame / fps;
  const angle = time * cameraSpeed;
  const distance = radius * 3.2;
  const elevation = Math.sin(time * cameraSpeed * 0.6) * radius * 0.8;
  return [Math.sin(angle) * distance, elevation, Math.cos(angle) * distance];
}
