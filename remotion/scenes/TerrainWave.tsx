import React from 'react';
import {Line} from '@react-three/drei';
import {visualizeAudio} from '@remotion/media-utils';
import type {SceneProps} from './types';

export const TERRAIN_ROWS = 14;
const ROW_FRAME_STEP = 3;

/**
 * A synthwave-style receding grid of contour lines. Each row samples the
 * spectrum at a slightly earlier point in time than the one in front of it,
 * so the whole grid reads as a landscape the audio's history has carved,
 * scrolling toward the camera as time advances.
 */
export const TerrainWave: React.FC<SceneProps> = ({
  audioData,
  frame,
  fps,
  settings,
}) => {
  const {barCount, radius, heightScale, hueStart, hueEnd} = settings;
  const rowSpacing = radius * 0.7;
  const width = radius * 4.5;
  // Center the whole grid on the origin so the default (auto look-at-origin)
  // camera frames the middle of the terrain, not just its nearest edge.
  const zOffset = (TERRAIN_ROWS * rowSpacing) / 2;

  return (
    <>
      {new Array(TERRAIN_ROWS).fill(0).map((_, r) => {
        const rowFrame = Math.max(0, frame - r * ROW_FRAME_STEP);
        const spectrum = visualizeAudio({
          audioData,
          frame: rowFrame,
          fps,
          numberOfSamples: barCount,
        });

        const z = zOffset - r * rowSpacing;
        const points: [number, number, number][] = spectrum.map(
          (amplitude, i) => {
            const x = (i / (barCount - 1) - 0.5) * width;
            const y = Math.sqrt(amplitude) * heightScale * 0.7;
            return [x, y, z];
          },
        );

        const depthFactor = 1 - r / TERRAIN_ROWS;
        const hue = (hueStart + depthFactor * (hueEnd - hueStart)) % 360;

        return (
          <Line
            key={r}
            points={points}
            color={`hsl(${hue}, 85%, ${45 + depthFactor * 25}%)`}
            lineWidth={2}
            transparent
            opacity={0.25 + depthFactor * 0.75}
          />
        );
      })}
    </>
  );
};

export function terrainWaveCameraPosition(
  frame: number,
  fps: number,
  radius: number,
  cameraSpeed: number,
): [number, number, number] {
  const time = frame / fps;
  const sway = Math.sin(time * cameraSpeed * 0.5) * radius * 0.6;
  const rowSpacing = radius * 0.7;
  const halfDepth = (TERRAIN_ROWS * rowSpacing) / 2;
  // Elevated and pulled back beyond the near edge, angled down at the
  // terrain's center - the classic "flying over a synthwave landscape" shot.
  return [sway, radius * 3.2, halfDepth + radius * 2.5];
}
