import React, {useCallback, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {useAudioData} from '@remotion/media-utils';
import {ThreeCanvas} from '@remotion/three';
import type {AudioVisualizerProps} from '../types';
import {getTrackAnalysis} from '../audio/analysis';
import {sanitizeScene} from '../scene/sanitize';
import {SceneRenderer} from '../scene/SceneRenderer';

/**
 * The one composition behind both the live preview and the final render:
 * an audio file plus a scene document in, a 3D picture per frame out.
 */
export const AudioVisualizer3D: React.FC<AudioVisualizerProps> = ({
  audioSrc,
  scene: rawScene,
  assetBase,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const audioData = useAudioData(audioSrc);
  // Guarantees a complete, in-range document even for scenes saved by an
  // older version of the editor.
  const scene = useMemo(() => sanitizeScene(rawScene), [rawScene]);
  const background = scene.look.background;
  const assetUrl = useCallback((key: string) => `${assetBase}${key}`, [assetBase]);

  if (!audioData) {
    return <AbsoluteFill style={{backgroundColor: background}} />;
  }

  // Cached per audio file, so this only costs time on the very first frame.
  const analysis = getTrackAnalysis(audioData);
  const time = frame / fps;

  return (
    <AbsoluteFill style={{backgroundColor: background}}>
      <Audio src={audioSrc} />
      {/* The camera is positioned by the SceneRenderer, see CameraRig there. */}
      <ThreeCanvas width={width} height={height}>
        <SceneRenderer
          scene={scene}
          analysis={analysis}
          time={time}
          assetUrl={assetUrl}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
