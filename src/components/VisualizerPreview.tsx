"use client";

import { Player } from "@remotion/player";
import { AudioVisualizer3D } from "../../remotion/compositions/AudioVisualizer3D";

const FPS = 30;
// Matches scripts/generate-demo-audio.mjs (12s demo track).
const DURATION_IN_FRAMES = 12 * FPS;

export function VisualizerPreview() {
  return (
    <Player
      component={AudioVisualizer3D}
      durationInFrames={DURATION_IN_FRAMES}
      compositionWidth={1280}
      compositionHeight={720}
      fps={FPS}
      style={{ width: "100%", maxWidth: 960 }}
      controls
      loop
      clickToPlay
    />
  );
}
