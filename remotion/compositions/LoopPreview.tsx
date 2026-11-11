import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import type {AudioVisualizerProps} from '../types';
import {AudioVisualizer3D} from './AudioVisualizer3D';

export type LoopPreviewProps = AudioVisualizerProps & {
  /** First frame of the stretch that is rendered. */
  loopStart: number;
  /** Length of the loop in frames. Must not be larger than `loopStart`. */
  loopFrames: number;
  /** Over how many frames the end melts into the beginning. */
  fadeFrames: number;
};

/**
 * A stretch of a scene that loops without a visible jump - for the short
 * clips on template cards (see scripts/previews.ts).
 *
 * A scene driven by music never returns to where it started, so the end is
 * blended into what came just *before* the start: during the last frames a
 * second copy of the scene, one loop length earlier in time, fades in on
 * top. When the clip wraps around, that copy has arrived exactly at the
 * first frame, and the picture carries on unbroken.
 */
export const LoopPreview: React.FC<LoopPreviewProps> = ({
  loopStart,
  loopFrames,
  fadeFrames,
  ...scene
}) => {
  const frame = useCurrentFrame();
  const end = loopStart + loopFrames;
  const blend = interpolate(frame, [end - fadeFrames, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <AudioVisualizer3D {...scene} />
      {blend > 0 ? (
        <AbsoluteFill style={{opacity: blend}}>
          {/* Shifted by one loop length: shows the frames before the start. */}
          <Sequence from={loopFrames}>
            <AudioVisualizer3D {...scene} />
          </Sequence>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
