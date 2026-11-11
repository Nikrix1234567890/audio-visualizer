"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import { AudioVisualizer3D } from "../../../remotion/compositions/AudioVisualizer3D";
import type { SceneDocument } from "../../../remotion/scene/definitions";

const COMPOSITION_WIDTH = 1280;
const COMPOSITION_HEIGHT = 720;
const ASPECT = COMPOSITION_WIDTH / COMPOSITION_HEIGHT;
/** Bezel padding (p-2) on both sides, see the scope frame below. */
const BEZEL = 16;

/**
 * The "scope": the live 3D picture, fitted into whatever space the layout
 * gives it. It has no controls of its own - playback is driven from the
 * transport bar through the player ref handed to `onPlayer`.
 */
export function Preview({
  audioUrl,
  durationInFrames,
  fps,
  scene,
  initiallyMuted,
  isLoading,
  onPlayer,
  onPickFile,
}: {
  audioUrl: string | null;
  durationInFrames: number;
  fps: number;
  scene: SceneDocument;
  initiallyMuted: boolean;
  isLoading: boolean;
  onPlayer: (player: PlayerRef | null) => void;
  onPickFile: (file: File) => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = areaRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setArea({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Largest 16:9 box (plus bezel) that fits into the available area.
  const maxWidth = Math.max(0, area.width - BEZEL);
  const maxHeight = Math.max(0, area.height - BEZEL);
  const width = Math.floor(Math.min(maxWidth, maxHeight * ASPECT));
  const height = Math.floor(width / ASPECT);

  return (
    <section className="editor-area-preview flex min-h-0 min-w-0 p-4">
      <div
        ref={areaRef}
        className="flex aspect-video min-h-0 w-full items-center justify-center lg:aspect-auto lg:h-full"
      >
        {width > 0 && (
          <div className="relative rounded-[10px] border border-hairline bg-panel p-2 shadow-scope-recessed">
            <Rivet className="left-1 top-1" />
            <Rivet className="right-1 top-1" />
            <Rivet className="bottom-1 left-1" />
            <Rivet className="bottom-1 right-1" />

            {audioUrl ? (
              <Player
                ref={onPlayer}
                component={AudioVisualizer3D}
                inputProps={{ audioSrc: audioUrl, scene }}
                durationInFrames={durationInFrames}
                compositionWidth={COMPOSITION_WIDTH}
                compositionHeight={COMPOSITION_HEIGHT}
                fps={fps}
                style={{ width, height, borderRadius: 6, overflow: "hidden" }}
                controls={false}
                initiallyMuted={initiallyMuted}
                clickToPlay
                doubleClickToFullscreen={false}
                spaceKeyToPlayOrPause={false}
                loop
                acknowledgeRemotionLicense
              />
            ) : (
              <DropZone
                width={width}
                height={height}
                isLoading={isLoading}
                onPickFile={onPickFile}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function DropZone({
  width,
  height,
  isLoading,
  onPickFile,
}: {
  width: number;
  height: number;
  isLoading: boolean;
  onPickFile: (file: File) => void;
}) {
  return (
    <label
      style={{ width, height }}
      className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md bg-chassis"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-hairline transition-colors group-hover:border-amber">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4" className="fill-steel" />
          <path
            d="M12 2v6M12 16v6M2 12h6M16 12h6"
            stroke="var(--steel-label)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-mono text-[11px] tracking-[0.08em] text-steel uppercase">
        {isLoading ? "Reading track…" : "Input"}
      </span>
      {!isLoading && (
        <span className="text-xs text-steel">
          Drop a track here or click to select one
        </span>
      )}
      <input
        type="file"
        accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.flac"
        className="hidden"
        disabled={isLoading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPickFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function Rivet({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute z-10 h-1 w-1 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.5),rgba(0,0,0,0.6))] ${className}`}
    />
  );
}
