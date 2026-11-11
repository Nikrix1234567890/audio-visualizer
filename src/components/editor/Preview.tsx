"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioVisualizer3D } from "../../../remotion/compositions/AudioVisualizer3D";
import type { SceneDocument } from "../../../remotion/scene/definitions";
import type {
  SceneEditorHooks,
  TransformTool,
} from "../../../remotion/scene/SceneRenderer";
import { ASPECTS, outputSize, type AspectKey } from "../../../remotion/types";
import { SegmentedSelector } from "@/components/ui/SegmentedSelector";

/** The preview is drawn at the smallest export size of the chosen format. */
const PREVIEW_RESOLUTION = "720p";
/** Bezel padding (p-2) on both sides, see the scope frame below. */
const BEZEL = 16;

const TOOLS: { value: TransformTool; label: string }[] = [
  { value: "move", label: "Move" },
  { value: "rotate", label: "Rotate" },
  { value: "scale", label: "Scale" },
  { value: "off", label: "Off" },
];

/**
 * The "scope": the live 3D picture, fitted into whatever space the layout
 * gives it. It has no playback controls of its own - those live in the
 * transport bar. While paused, clicking an element selects it and the
 * chosen tool's handles let you move, rotate or scale it right in the
 * picture.
 */
export function Preview({
  audioUrl,
  durationInFrames,
  fps,
  aspect,
  scene,
  initiallyMuted,
  isLoading,
  onPlayer,
  onPickFile,
  selectedId,
  onSelect,
  onTransform,
}: {
  audioUrl: string | null;
  durationInFrames: number;
  fps: number;
  aspect: AspectKey;
  scene: SceneDocument;
  initiallyMuted: boolean;
  isLoading: boolean;
  onPlayer: (player: PlayerRef | null) => void;
  onPickFile: (file: File) => void;
  selectedId: string | null;
  onSelect: SceneEditorHooks["onSelect"];
  onTransform: SceneEditorHooks["onTransform"];
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [tool, setTool] = useState<TransformTool>("move");
  const [player, setPlayer] = useState<PlayerRef | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Frames the preview actually produced during the last second of playback.
  const [measuredFps, setMeasuredFps] = useState<number | null>(null);

  const handlePlayer = useCallback(
    (instance: PlayerRef | null) => {
      setPlayer(instance);
      onPlayer(instance);
    },
    [onPlayer],
  );

  useEffect(() => {
    if (!player) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      setMeasuredFps(null);
    };

    // Count the frames shown per second, so smoothness is a number that can
    // be read off the screen instead of a feeling.
    let frames = 0;
    let since = performance.now();
    const onFrame = () => {
      frames++;
      const now = performance.now();
      if (now - since < 1000) return;
      if (player.isPlaying()) setMeasuredFps(Math.round((frames * 1000) / (now - since)));
      frames = 0;
      since = now;
    };

    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("frameupdate", onFrame);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("frameupdate", onFrame);
    };
  }, [player]);

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

  // The handles would only be in the way of a playing video.
  const activeTool = isPlaying ? "off" : tool;
  const inputProps = useMemo(
    () => ({
      audioSrc: audioUrl ?? "",
      scene,
      appBase: "",
      editor: { selectedId, tool: activeTool, onSelect, onTransform },
    }),
    [audioUrl, scene, selectedId, activeTool, onSelect, onTransform],
  );

  // Largest box of the chosen format (plus bezel) that fits into the
  // available area.
  const ratio = ASPECTS[aspect].ratio;
  const composition = outputSize(aspect, PREVIEW_RESOLUTION);
  const maxWidth = Math.max(0, area.width - BEZEL);
  const maxHeight = Math.max(0, area.height - BEZEL);
  const width = Math.floor(Math.min(maxWidth, maxHeight * ratio));
  const height = Math.floor(width / ratio);

  return (
    <section className="editor-area-preview flex min-h-0 min-w-0 flex-col gap-3 p-4">
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-mono text-[11px] tracking-[0.08em] text-steel uppercase">
          Tool
        </span>
        <SegmentedSelector options={TOOLS} value={tool} onChange={setTool} />
        <span className="hidden text-xs text-steel xl:inline">
          {isPlaying
            ? "Pause to edit in the picture."
            : "Click an element to select it, drag the handles to change it."}
        </span>
        {isPlaying && measuredFps !== null && (
          <span
            className="ml-auto font-mono text-[11px] tracking-[0.06em] text-steel uppercase tabular-nums"
            title="Frames the preview showed in the last second"
          >
            {measuredFps} / {fps} fps
          </span>
        )}
      </div>

      <div
        ref={areaRef}
        className="flex aspect-video min-h-0 w-full items-center justify-center lg:aspect-auto lg:flex-1"
      >
        {width > 0 && (
          <div className="relative rounded-[10px] border border-hairline bg-panel p-2 shadow-scope-recessed">
            <Rivet className="left-1 top-1" />
            <Rivet className="right-1 top-1" />
            <Rivet className="bottom-1 left-1" />
            <Rivet className="bottom-1 right-1" />

            {audioUrl ? (
              <Player
                ref={handlePlayer}
                component={AudioVisualizer3D}
                inputProps={inputProps}
                durationInFrames={durationInFrames}
                compositionWidth={composition.width}
                compositionHeight={composition.height}
                fps={fps}
                style={{ width, height, borderRadius: 6, overflow: "hidden" }}
                controls={false}
                initiallyMuted={initiallyMuted}
                clickToPlay={false}
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
