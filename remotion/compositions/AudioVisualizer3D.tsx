import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {ThreeCanvas} from '@remotion/three';

const NUMBER_OF_SAMPLES = 64; // must be a power of two

const audioSrc = staticFile('audio/demo-track.wav');

/**
 * Radial 3D bar field driven by real audio spectrum data.
 * This is the first true "audio -> 3D visual" proof for the project,
 * replacing the placeholder sine-wave bars from Demo3D.
 */
const Bars: React.FC<{spectrum: number[]}> = ({spectrum}) => {
  const barCount = spectrum.length;

  return (
    <>
      {spectrum.map((amplitude, i) => {
        const angle = (i / barCount) * Math.PI * 2;
        const radius = 4;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // Raw FFT amplitude is heavily skewed toward the bass end, so we
        // apply a soft compression curve (comparable to the "compK" idea
        // from the old vanilla-JS version) to make mid/high bands visible.
        const compressed = Math.sqrt(amplitude);
        const height = 0.15 + compressed * 4.5;

        return (
          <mesh key={i} position={[x, height / 2 - 1.2, z]}>
            <boxGeometry args={[0.3, height, 0.3]} />
            <meshStandardMaterial
              color={`hsl(${(i / barCount) * 300 + 200}, 85%, 60%)`}
            />
          </mesh>
        );
      })}
    </>
  );
};

export const AudioVisualizer3D: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const audioData = useAudioData(audioSrc);

  const cameraAngle = (frame / fps) * 0.25;
  const cameraX = Math.sin(cameraAngle) * 9;
  const cameraZ = Math.cos(cameraAngle) * 9;

  if (!audioData) {
    return <AbsoluteFill style={{backgroundColor: '#05070d'}} />;
  }

  const spectrum = visualizeAudio({
    audioData,
    frame,
    fps,
    numberOfSamples: NUMBER_OF_SAMPLES,
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
        <Bars spectrum={spectrum} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
