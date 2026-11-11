import React, {useCallback, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {useAudioData} from '@remotion/media-utils';
import {ThreeCanvas} from '@remotion/three';
import type {AudioVisualizerProps} from '../types';
import {getTrackAnalysis} from '../audio/analysis';
import {sanitizeScene} from '../scene/sanitize';
import {SceneRenderer} from '../scene/SceneRenderer';

/** The font used by Text elements, shipped with the app in public/fonts. */
const FONT_PATH = 'fonts/Geist-Regular.ttf';

/**
 * The one composition behind both the live preview and the final render:
 * an audio file plus a scene document in, a 3D picture per frame out.
 */
export const AudioVisualizer3D: React.FC<AudioVisualizerProps> = ({
  audioSrc,
  scene: rawScene,
  appBase,
  editor,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const audioData = useAudioData(audioSrc);
  // Guarantees a complete, in-range document even for scenes saved by an
  // older version of the editor.
  const scene = useMemo(() => sanitizeScene(rawScene), [rawScene]);
  const background = scene.look.background;
  const assetUrl = useCallback(
    (key: string) => `${appBase}/api/files/${key}`,
    [appBase],
  );

  if (!audioData) {
    return <AbsoluteFill style={{backgroundColor: background}} />;
  }

  // Cached per audio file, so this only costs time on the very first frame.
  const analysis = getTrackAnalysis(audioData);
  const time = frame / fps;

  return (
    <AbsoluteFill style={{backgroundColor: background}}>
      <Audio src={audioSrc} />
      {/* The camera is positioned by the SceneRenderer, see CameraRig there.
          dpr 1: draw exactly width x height pixels. On a high-density
          screen the default would draw four times as many for a preview
          that is shown scaled down anyway - a large, invisible cost. */}
      <ThreeCanvas width={width} height={height} dpr={1}>
        <SceneRenderer
          scene={scene}
          analysis={analysis}
          time={time}
          assetUrl={assetUrl}
          fontUrl={`${appBase}/${FONT_PATH}`}
          editor={editor}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
