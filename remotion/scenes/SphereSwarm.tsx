import React, {useMemo} from 'react';
import {visualizeAudio} from '@remotion/media-utils';
import type {SceneProps} from './types';

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
 * sun/urchin instead of a flat ring.
 */
export const SphereSwarm: React.FC<SceneProps> = ({
  audioData,
  frame,
  fps,
  settings,
}) => {
  const {barCount, radius, barWidth, heightScale, hueStart, hueEnd} = settings;

  const basePoints = useMemo(() => fibonacciSpherePoints(barCount), [barCount]);

  const spectrum = visualizeAudio({
    audioData,
    frame,
    fps,
    numberOfSamples: barCount,
  });

  const time = frame / fps;

  return (
    <>
      {basePoints.map(([nx, ny, nz], i) => {
        const amplitude = spectrum[i] ?? 0;
        const compressed = Math.sqrt(amplitude);
        const displacement = radius + compressed * heightScale * 1.4;
        const wobble = Math.sin(time * 1.5 + i) * 0.05 * radius;

        const x = nx * (displacement + wobble);
        const y = ny * (displacement + wobble);
        const z = nz * (displacement + wobble);

        const hue = (hueStart + (i / barCount) * (hueEnd - hueStart)) % 360;
        const size = 0.08 + barWidth * 0.4 + compressed * 0.18;

        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[size, 10, 10]} />
            <meshStandardMaterial
              color={`hsl(${hue}, 90%, 62%)`}
              emissive={`hsl(${hue}, 95%, 45%)`}
              emissiveIntensity={0.5 + compressed * 1.1}
            />
          </mesh>
        );
      })}
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
