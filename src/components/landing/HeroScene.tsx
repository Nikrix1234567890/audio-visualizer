"use client";

import type { PlayerRef } from "@remotion/player";
import dynamic from "next/dynamic";
import type { RefObject } from "react";

// The 3D engine is large; it loads after the page is up, and only in the
// browser. Until then the recorded loop below is shown.
const HeroPlayer = dynamic(() => import("./HeroPlayer"), { ssr: false });

/**
 * The picture on the stage of the hero's editor: the recorded loop of the
 * template at once, and the live, playing 3D scene on top as soon as it has
 * loaded. Nothing is laid over the canvas.
 */
export function HeroScene({
  templateId,
  label,
  isLive,
  playerRef,
}: {
  templateId: string;
  label: string;
  /** Whether the live scene may be loaded (false until the stage was seen, and with reduced motion). */
  isLive: boolean;
  playerRef: RefObject<PlayerRef | null>;
}) {
  return (
    <>
      {/* Shown at once, and stays if the live scene cannot start. */}
      <video
        key={templateId}
        src={`/previews/${templateId}.mp4`}
        poster={`/thumbnails/templates/${templateId}.jpg`}
        autoPlay={isLive}
        muted
        loop
        playsInline
        aria-label={`The ${label} template playing`}
      />
      {isLive && (
        <div className="absolute inset-0">
          <HeroPlayer templateId={templateId} playerRef={playerRef} />
        </div>
      )}
    </>
  );
}
