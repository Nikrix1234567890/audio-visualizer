"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useMemo, type RefObject } from "react";
import { AudioVisualizer3D } from "../../../remotion/compositions/AudioVisualizer3D";
import { TEMPLATES } from "../../../remotion/scene/templates";

export const HERO_FPS = 60;
/** Length of the demo track in public/audio. */
export const HERO_SECONDS = 12;

/**
 * The live scene in the landing page hero: the real composition, playing
 * the demo track without sound. Loaded on its own (see HeroScene) because
 * it brings the whole 3D engine with it.
 */
export default function HeroPlayer({
  templateId,
  playerRef,
}: {
  templateId: string;
  /** Lets the hero read the frame being shown and pause the scene off screen. */
  playerRef?: RefObject<PlayerRef | null>;
}) {
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
      ref={playerRef}
      component={AudioVisualizer3D}
      inputProps={inputProps}
      durationInFrames={HERO_SECONDS * HERO_FPS}
      compositionWidth={1280}
      compositionHeight={720}
      fps={HERO_FPS}
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
