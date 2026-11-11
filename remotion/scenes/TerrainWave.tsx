import React from 'react';
import {Line, Stars} from '@react-three/drei';
import {getAudioFrame, getSpectrum} from '../audio/analysis';
import type {SceneProps} from './types';
import {PostFX} from './PostFX';

export const TERRAIN_ROWS = 14;
/** How much further back in time each row looks than the one in front of it. */
const ROW_DELAY_SECONDS = 0.1;

/**
 * A synthwave-style receding grid of contour lines, under a starfield sky
 * with a glowing horizon sun. Each row samples the spectrum at a slightly
 * earlier point in time than the one in front of it, so the whole grid
 * reads as a landscape the audio's history has carved, scrolling toward
 * the camera as time advances.
 */
export const TerrainWave: React.FC<SceneProps> = ({
  analysis,
  frame,
  fps,
  settings,
}) => {
  const {barCount, radius, heightScale, hueStart, hueEnd} = settings;
  const rowSpacing = radius * 0.7;
  const width = radius * 4.5;
  const zOffset = (TERRAIN_ROWS * rowSpacing) / 2;
  const sunHue = hueStart % 360;
  const time = frame / fps;
  const {beat} = getAudioFrame(analysis, time);

  return (
    <>
      <Stars
        radius={radius * 30}
        depth={radius * 10}
        count={2000}
        factor={radius * 0.6}
        saturation={0}
        fade
        speed={0.3}
      />

      {/* Horizon sun: a bright emissive disc bloom turns into a soft glow.
          Excluded from scene fog (fog=false) so it stays visible despite
          sitting near the fog's far plane. */}
      <mesh
        position={[0, radius * 0.6, -zOffset - radius * 3]}
        scale={1 + beat * 0.06}
      >
        <circleGeometry args={[radius * 2.2, 48]} />
        <meshBasicMaterial color={`hsl(${sunHue}, 95%, 62%)`} fog={false} />
      </mesh>

      {new Array(TERRAIN_ROWS).fill(0).map((_, r) => {
        const spectrum = getSpectrum(
          analysis,
          Math.max(0, time - r * ROW_DELAY_SECONDS),
          barCount,
        );

        const z = zOffset - r * rowSpacing;
        const points: [number, number, number][] = spectrum.map(
          (amplitude, i) => {
            const x = (i / (barCount - 1) - 0.5) * width;
            const y = amplitude * heightScale * 0.7;
            return [x, y, z];
          },
        );

        const depthFactor = 1 - r / TERRAIN_ROWS;
        const hue = (hueStart + depthFactor * (hueEnd - hueStart)) % 360;

        return (
          <Line
            key={r}
            points={points}
            color={`hsl(${hue}, 95%, ${55 + depthFactor * 25}%)`}
            lineWidth={2.5}
            transparent
            opacity={0.3 + depthFactor * 0.7}
          />
        );
      })}
      <PostFX />
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
