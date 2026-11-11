import React, {useCallback, useMemo} from 'react';
import {AbsoluteFill, Html5Audio, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData} from '@remotion/media-utils';
import {ThreeCanvas} from '@remotion/three';
import type {AudioVisualizerProps} from '../types';
import {getTrackAnalysis} from '../audio/analysis';
import {sanitizeScene} from '../scene/sanitize';
import {SceneRenderer} from '../scene/SceneRenderer';

/** Where the text fonts live, shipped with the app in public/fonts. */
const FONT_FOLDER = 'fonts';

/**
 * The one composition behind both the live preview and the final render:
 * an audio file plus a scene document in, a 3D picture per frame out.
 */
export const AudioVisualizer3D: React.FC<AudioVisualizerProps> = ({
  audioSrc,
  scene: rawScene,
  appBase,
  fileToken,
  watermark,
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
    (key: string) =>
      `${appBase}/api/files/${key}` +
      (fileToken ? `?t=${encodeURIComponent(fileToken)}` : ''),
    [appBase, fileToken],
  );

  if (!audioData) {
    return <AbsoluteFill style={{backgroundColor: background}} />;
  }

  // Cached per audio file, so this only costs time on the very first frame.
  const analysis = getTrackAnalysis(audioData);
  const time = frame / fps;

  return (
    <AbsoluteFill style={{backgroundColor: background}}>
      {/* A plain HTML audio element: the browser plays it on its own audio
          thread, so the sound keeps running smoothly even when drawing a
          frame takes a moment too long. (The other Remotion audio component
          feeds the sound from the main thread, in step with the frames, and
          stutters whenever that thread is busy.) */}
      <Html5Audio src={audioSrc} />
      {/* The camera is positioned by the SceneRenderer, see CameraRig there.
          dpr 1: draw exactly width x height pixels. On a high-density
          screen the default would draw four times as many for a preview
          that is shown scaled down anyway - a large, invisible cost.
          frameloop "demand": draw only when something changed (a new
          frame, an edited setting, a dragged handle). The default redraws
          on every screen refresh - on a 144 or 240 Hz monitor that is
          several full passes of the scene and its glow per video frame,
          all issued from the browser's one main thread. Ignored during a
          server render, which always draws exactly once per frame. */}
      <ThreeCanvas width={width} height={height} dpr={1} frameloop="demand">
        <SceneRenderer
          scene={scene}
          analysis={analysis}
          time={time}
          assetUrl={assetUrl}
          fontBase={`${appBase}/${FONT_FOLDER}`}
          editor={editor}
        />
      </ThreeCanvas>
      {watermark ? (
        // Sized from the picture's short side, so it takes the same share
        // of a 720p preview and a larger render, in every format.
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            padding: Math.min(width, height) * 0.035,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontWeight: 700,
              fontSize: Math.min(width, height) * 0.034,
              letterSpacing: '0.02em',
              color: 'rgba(255, 255, 255, 0.6)',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.7)',
            }}
          >
            Audio<span style={{color: 'rgba(255, 138, 61, 0.85)'}}>Visualizer</span>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
