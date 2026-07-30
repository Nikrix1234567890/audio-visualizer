import React from 'react';
import {Grid} from '@react-three/drei';
import {visualizeAudio} from '@remotion/media-utils';
import type {SceneProps} from './types';
import {PostFX} from './PostFX';

/** Radial ring of bars, each driven by one frequency bin. */
export const RadialBars: React.FC<SceneProps> = ({
  audioData,
  frame,
  fps,
  settings,
}) => {
  const {barCount, radius, barWidth, heightScale, hueStart, hueEnd} = settings;
  const time = frame / fps;

  const spectrum = visualizeAudio({
    audioData,
    frame,
    fps,
    numberOfSamples: barCount,
  });

  return (
    <>
      <Grid
        position={[0, -1.25, 0]}
        args={[radius * 8, radius * 8]}
        cellSize={radius * 0.25}
        cellThickness={0.6}
        cellColor="#3a2a1a"
        sectionSize={radius}
        sectionThickness={1.2}
        sectionColor="#ff8a3d"
        fadeDistance={radius * 9}
        fadeStrength={2}
        infiniteGrid
      />
      {/* A soft glowing core beneath the ring, ties the composition together. */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.9, 48]} />
        <meshBasicMaterial
          color={`hsl(${(hueStart + hueEnd) / 2 % 360}, 90%, 55%)`}
          transparent
          opacity={0.06}
        />
      </mesh>
      {spectrum.map((amplitude, i) => {
        const angle = (i / barCount) * Math.PI * 2 + time * 0.05;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // Raw FFT amplitude is heavily skewed toward the bass end, so we
        // apply a soft compression curve to make mid/high bands visible.
        const compressed = Math.sqrt(amplitude);
        const height = 0.15 + compressed * heightScale;
        const hue = (hueStart + (i / barCount) * (hueEnd - hueStart)) % 360;

        return (
          <mesh key={i} position={[x, height / 2 - 1.2, z]}>
            <boxGeometry args={[barWidth, height, barWidth]} />
            <meshStandardMaterial
              color={`hsl(${hue}, 90%, 55%)`}
              emissive={`hsl(${hue}, 100%, 55%)`}
              emissiveIntensity={0.8 + compressed * 3.2}
              roughness={0.35}
              metalness={0.4}
            />
          </mesh>
        );
      })}
      <PostFX />
    </>
  );
};

export function radialBarsCameraPosition(
  frame: number,
  fps: number,
  radius: number,
  cameraSpeed: number,
): [number, number, number] {
  const angle = (frame / fps) * cameraSpeed;
  const distance = radius * 2.25;
  const bob = Math.sin((frame / fps) * cameraSpeed * 0.7) * 0.6;
  return [Math.sin(angle) * distance, 4 + bob, Math.cos(angle) * distance];
}
