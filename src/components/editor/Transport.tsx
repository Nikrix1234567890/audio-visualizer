"use client";

import type { MediaUtilsAudioData } from "@remotion/media-utils";
import type { PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import type { ExportRange } from "@/lib/visualizerSettings";
import { KeyframeLanes, type TimelineLane } from "./KeyframeLanes";
import type { TimelineView } from "./TimeDiamond";
import {
  formatTime,
  Waveform,
  type MarkerOwner,
  type TimelineMarker,
} from "./Waveform";

/** How far the timeline can be zoomed in. */
const ZOOMS = [1, 2, 4, 8, 16];

const ACCEPTED_AUDIO = "audio/*,.wav,.mp3,.m4a,.aac,.ogg,.flac";
/** How often the transport UI follows the playing video. */
const UI_REFRESH_MS = 80;

/**
 * The bar under the preview: load a track, play/pause, time, mute, and the
 * waveform used to move through the song. It drives the (control-less)
 * Remotion player in the preview through `player`.
 *
 * Give this component a `key` that changes with the loaded track, so its
 * playback position starts fresh for every new file.
 */
export function Transport({
  player,
  audioData,
  fileName,
  durationInFrames,
  fps,
  muted,
  onToggleMute,
  onPickFile,
  markers,
  onMoveMarker,
  lanes,
  onMoveKey,
  range,
  onRangeChange,
}: {
  player: PlayerRef | null;
  audioData: MediaUtilsAudioData | null;
  fileName: string | null;
  durationInFrames: number;
  fps: number;
  muted: boolean;
  onToggleMute: () => void;
  onPickFile: (file: File) => void;
  /** Keyframes to show in the timeline. */
  markers: TimelineMarker[];
  onMoveMarker: (owner: MarkerOwner, from: number, to: number) => void;
  /** One row per animated setting, shown under the waveform. */
  lanes: TimelineLane[];
  onMoveKey: (lane: TimelineLane, from: number, to: number, copy: boolean) => void;
  /** The section that will be exported, or null for the whole track. */
  range: ExportRange | null;
  onRangeChange: (range: ExportRange) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!player) return;
    // While playing, the time readout and the waveform's playhead are
    // refreshed a dozen times a second - not for every video frame. Redrawing
    // them 60 times a second would spend main-thread time the 3D picture
    // needs, for no visible gain.
    let lastUpdate = 0;
    const onFrame = (e: { detail: { frame: number } }) => {
      const now = performance.now();
      if (player.isPlaying() && now - lastUpdate < UI_REFRESH_MS) return;
      lastUpdate = now;
      setFrame(e.detail.frame);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      // Show the exact position once playback stops.
      setFrame(player.getCurrentFrame());
    };

    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [player]);

  const ready = Boolean(player && audioData);

  // The stretch of the track on screen. Zoomed in, the timeline shows one
  // "page" and turns to the next when the playhead leaves it.
  const duration = durationInFrames / fps;
  const seconds = frame / fps;
  const length = duration / zoom;
  const view: TimelineView = {
    start: Math.max(0, Math.min(duration - length, Math.floor(seconds / length) * length)),
    length,
  };
  const zoomIndex = ZOOMS.indexOf(zoom);
  const zoomButton =
    "flex h-6 w-6 items-center justify-center rounded-md border border-line font-mono text-xs text-ink outline-none hover:border-accent-dim hover:text-accent focus-visible:border-accent disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40";

  return (
    <div className="editor-area-transport surface-texture flex min-h-0 flex-col gap-3 border-t border-line bg-surface p-3 lg:flex-row lg:items-stretch lg:border-t-0">
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          title={fileName ?? "Load an audio file"}
          className="flex max-w-44 items-center gap-2 rounded-md border border-line bg-surface-raised px-3 py-2 font-mono text-[11px] tracking-[0.06em] text-ink uppercase shadow-control-raised outline-none hover:border-accent-dim hover:text-accent focus-visible:border-accent"
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              fileName ? "bg-accent shadow-glow-active" : "bg-accent-dim"
            }`}
          />
          <span className="truncate normal-case">
            {fileName ?? "Load track"}
          </span>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_AUDIO}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPickFile(file);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          disabled={!ready}
          onClick={(e) => player?.toggle(e)}
          aria-label={isPlaying ? "Pause" : "Play"}
          title="Play / pause (Space)"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface-raised shadow-control-raised outline-none hover:border-accent-dim hover:text-accent focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-40 ${
            isPlaying ? "text-accent shadow-glow-active" : "text-ink"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            {isPlaying ? (
              <path d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor" />
            ) : (
              <path d="M4 2l8 5-8 5z" fill="currentColor" />
            )}
          </svg>
        </button>

        <span className="w-24 shrink-0 font-mono text-[13px] text-ink tabular-nums">
          {formatTime(frame / fps)}
          <span className="text-muted"> / {formatTime(durationInFrames / fps)}</span>
        </span>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
          title={muted ? "Unmute" : "Mute"}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line outline-none hover:border-accent-dim focus-visible:border-accent ${
            muted ? "text-muted" : "text-ink"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden fill="none">
            <path d="M2 6h2.5L8 3v10L4.5 10H2z" fill="currentColor" />
            {muted ? (
              <path
                d="M10.5 6l4 4m0-4l-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M10.5 5.5a3.5 3.5 0 010 5M12.3 3.7a6 6 0 010 8.6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1 lg:flex-col lg:justify-center">
        <button
          type="button"
          className={zoomButton}
          disabled={zoomIndex >= ZOOMS.length - 1}
          aria-label="Zoom into the timeline"
          title="Zoom in"
          onClick={() => setZoom(ZOOMS[zoomIndex + 1])}
        >
          +
        </button>
        <span className="w-6 text-center font-mono text-[10px] text-muted tabular-nums">
          {zoom}x
        </span>
        <button
          type="button"
          className={zoomButton}
          disabled={zoomIndex <= 0}
          aria-label="Zoom out of the timeline"
          title="Zoom out"
          onClick={() => setZoom(ZOOMS[zoomIndex - 1])}
        >
          -
        </button>
      </div>

      <div className="flex h-24 min-w-0 flex-1 flex-col gap-1.5 lg:h-auto">
        <div className="min-h-0 flex-1">
        <Waveform
          audioData={audioData}
          frame={frame}
          durationInFrames={durationInFrames}
          fps={fps}
          view={view}
          onSeek={(target) => player?.seekTo(target)}
          markers={markers}
          onMoveMarker={onMoveMarker}
          range={range}
          onRangeChange={onRangeChange}
        />
        </div>
        {audioData && lanes.length > 0 && (
          <KeyframeLanes
            lanes={lanes}
            view={view}
            seconds={seconds}
            onGo={(t) => player?.seekTo(Math.round(t * fps))}
            onMoveKey={onMoveKey}
          />
        )}
      </div>
    </div>
  );
}
