import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {ThreeCanvas} from '@remotion/three';
import type {AudioVisualizerProps} from '../types';

/**
 * Radial 3D bar field driven by real audio spectrum data. Fully
 * parameterized (audio source + visual settings) so the same component is
 * used for the live in-browser editor preview (@remotion/player) and the
 * server-side render (@remotion/renderer) - guaranteeing 1:1 visual parity,
 * the same principle the original vanilla-JS version relied on.
 */
const Bars: React.FC<{
  spectrum: number[];
  radius: number;
  barWidth: number;
  heightScale: number;
  hueStart: number;
  hueEnd: number;
}> = ({spectrum, radius, barWidth, heightScale, hueStart, hueEnd}) => {
  const barCount = spectrum.length;

  return (
    <>
      {spectrum.map((amplitude, i) => {
        const angle = (i / barCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // Raw FFT amplitude is heavily skewed toward the bass end, so we
        // apply a soft compression curve (comparable to the "compK" idea
        // from the old vanilla-JS version) to make mid/high bands visible.
        const compressed = Math.sqrt(amplitude);
        const height = 0.15 + compressed * heightScale;
        const hue = (hueStart + (i / barCount) * (hueEnd - hueStart)) % 360;

        return (
          <mesh key={i} position={[x, height / 2 - 1.2, z]}>
            <boxGeometry args={[barWidth, height, barWidth]} />
            <meshStandardMaterial color={`hsl(${hue}, 85%, 60%)`} />
          </mesh>
        );
      })}
    </>
  );
};

export const AudioVisualizer3D: React.FC<AudioVisualizerProps> = ({
  audioSrc,
  barCount,
  radius,
  barWidth,
  heightScale,
  hueStart,
  hueEnd,
  cameraSpeed,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const audioData = useAudioData(audioSrc);

  const cameraAngle = (frame / fps) * cameraSpeed;
  const cameraDistance = radius * 2.25;
  const cameraX = Math.sin(cameraAngle) * cameraDistance;
  const cameraZ = Math.cos(cameraAngle) * cameraDistance;

  if (!audioData) {
    return <AbsoluteFill style={{backgroundColor: '#05070d'}} />;
  }

  const spectrum = visualizeAudio({
    audioData,
    frame,
    fps,
    numberOfSamples: barCount,
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#05070d'}}>
      <Audio src={audioSrc} />
      <ThreeCanvas
        width={width}
        height={height}
        camera={{position: [cameraX, 4, cameraZ], fov: 50}}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <Bars
          spectrum={spectrum}
          radius={radius}
          barWidth={barWidth}
          heightScale={heightScale}
          hueStart={hueStart}
          hueEnd={hueEnd}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
