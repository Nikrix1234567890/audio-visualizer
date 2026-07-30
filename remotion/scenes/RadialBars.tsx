import React from 'react';
import {visualizeAudio} from '@remotion/media-utils';
import type {SceneProps} from './types';

/** Radial ring of bars, each driven by one frequency bin. */
export const RadialBars: React.FC<SceneProps> = ({
  audioData,
  frame,
  fps,
  settings,
}) => {
  const {barCount, radius, barWidth, heightScale, hueStart, hueEnd} = settings;

  const spectrum = visualizeAudio({
    audioData,
    frame,
    fps,
    numberOfSamples: barCount,
  });

  return (
    <>
      {spectrum.map((amplitude, i) => {
        const angle = (i / barCount) * Math.PI * 2;
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
              color={`hsl(${hue}, 85%, 60%)`}
              emissive={`hsl(${hue}, 85%, 35%)`}
              emissiveIntensity={0.4 + compressed * 0.6}
            />
          </mesh>
        );
      })}
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
  return [Math.sin(angle) * distance, 4, Math.cos(angle) * distance];
}
