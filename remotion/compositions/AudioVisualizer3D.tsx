import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {useAudioData} from '@remotion/media-utils';
import {ThreeCanvas} from '@remotion/three';
import type {AudioVisualizerProps} from '../types';
import {getTrackAnalysis} from '../audio/analysis';
import {RadialBars, radialBarsCameraPosition} from '../scenes/RadialBars';
import {SphereSwarm, sphereSwarmCameraPosition} from '../scenes/SphereSwarm';
import {TerrainWave, terrainWaveCameraPosition} from '../scenes/TerrainWave';

const BACKGROUND = '#05070d';

export const AudioVisualizer3D: React.FC<AudioVisualizerProps> = (props) => {
  const {audioSrc, scene, radius, cameraSpeed} = props;
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const audioData = useAudioData(audioSrc);

  if (!audioData) {
    return <AbsoluteFill style={{backgroundColor: BACKGROUND}} />;
  }

  // Cached per audio file, so this only costs time on the very first frame.
  const analysis = getTrackAnalysis(audioData);
  const sceneProps = {analysis, frame, fps, settings: props};

  const cameraPosition =
    scene === 'sphereSwarm'
      ? sphereSwarmCameraPosition(frame, fps, radius, cameraSpeed)
      : scene === 'terrainWave'
        ? terrainWaveCameraPosition(frame, fps, radius, cameraSpeed)
        : radialBarsCameraPosition(frame, fps, radius, cameraSpeed);

  return (
    <AbsoluteFill style={{backgroundColor: BACKGROUND}}>
      <Audio src={audioSrc} />
      <ThreeCanvas
        width={width}
        height={height}
        camera={{position: cameraPosition, fov: 50}}
      >
        {scene === 'terrainWave' ? (
          <fog attach="fog" args={[BACKGROUND, radius * 2, radius * 11]} />
        ) : null}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        {scene === 'sphereSwarm' ? (
          <SphereSwarm {...sceneProps} />
        ) : scene === 'terrainWave' ? (
          <TerrainWave {...sceneProps} />
        ) : (
          <RadialBars {...sceneProps} />
        )}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
