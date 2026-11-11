"use client";

import { Player } from "@remotion/player";
import { useMemo } from "react";
import { AudioVisualizer3D } from "../../../remotion/compositions/AudioVisualizer3D";
import { TEMPLATES } from "../../../remotion/scene/templates";

const FPS = 60;
/** Length of the demo track in public/audio. */
const DEMO_SECONDS = 12;

/**
 * The live scene in the landing page hero: the real composition, playing
 * the demo track without sound. Loaded on its own (see HeroScene) because
 * it brings the whole 3D engine with it.
 */
export default function HeroPlayer({ templateId }: { templateId: string }) {
  const inputProps = useMemo(
    () => ({
      audioSrc: "/audio/demo-track.wav",
      scene: (TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]).scene,
      appBase: "",
    }),
    [templateId],
  );

  return (
    <Player
      component={AudioVisualizer3D}
      inputProps={inputProps}
      durationInFrames={DEMO_SECONDS * FPS}
      compositionWidth={1280}
      compositionHeight={720}
      fps={FPS}
      style={{ width: "100%", height: "100%" }}
      controls={false}
      clickToPlay={false}
      doubleClickToFullscreen={false}
      spaceKeyToPlayOrPause={false}
      autoPlay
      loop
      initiallyMuted
      acknowledgeRemotionLicense
    />
  );
}
