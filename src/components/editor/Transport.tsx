"use client";

import type { MediaUtilsAudioData } from "@remotion/media-utils";
import type { PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import { formatTime, Waveform } from "./Waveform";

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
}: {
  player: PlayerRef | null;
  audioData: MediaUtilsAudioData | null;
  fileName: string | null;
  durationInFrames: number;
  fps: number;
  muted: boolean;
  onToggleMute: () => void;
  onPickFile: (file: File) => void;
}) {
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

  return (
    <div className="editor-area-transport chassis-grain flex min-h-0 flex-col gap-3 border-t border-hairline bg-panel p-3 lg:flex-row lg:items-stretch lg:border-t-0">
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          title={fileName ?? "Load an audio file"}
          className="flex max-w-44 items-center gap-2 rounded-md border border-hairline bg-panel-raised px-3 py-2 font-mono text-[11px] tracking-[0.06em] text-cream uppercase shadow-control-raised outline-none hover:border-amber-dim hover:text-amber focus-visible:border-amber"
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              fileName ? "bg-amber shadow-glow-active" : "bg-amber-dim"
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
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-panel-raised shadow-control-raised outline-none hover:border-amber-dim hover:text-amber focus-visible:border-amber disabled:cursor-not-allowed disabled:opacity-40 ${
            isPlaying ? "text-amber shadow-glow-active" : "text-cream"
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

        <span className="w-24 shrink-0 font-mono text-[13px] text-cream tabular-nums">
          {formatTime(frame / fps)}
          <span className="text-steel"> / {formatTime(durationInFrames / fps)}</span>
        </span>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
          title={muted ? "Unmute" : "Mute"}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-hairline outline-none hover:border-amber-dim focus-visible:border-amber ${
            muted ? "text-steel" : "text-cream"
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

      <div className="h-16 min-w-0 flex-1 lg:h-auto">
        <Waveform
          audioData={audioData}
          frame={frame}
          durationInFrames={durationInFrames}
          fps={fps}
          onSeek={(target) => player?.seekTo(target)}
        />
      </div>
    </div>
  );
}
