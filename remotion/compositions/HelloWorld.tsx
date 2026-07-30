import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * Minimal sanity-check composition to verify the Remotion pipeline
 * (Studio + CLI render) is wired up correctly. No 3D, no audio yet.
 */
export const HelloWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: {damping: 200},
  });

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0b0f19',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          fontSize: 80,
          fontWeight: 700,
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        Audio Visualizer v2
      </div>
    </AbsoluteFill>
  );
};
