"use client";

import type { MediaUtilsAudioData } from "@remotion/media-utils";
import type { PlayerRef } from "@remotion/player";
import { Minus, Music, Pause, Play, Plus, Volume2, VolumeX } from "lucide-react";
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
 * The bottom of the editor: a transport bar (play/pause, time, the track,
 * mute, zoom) and under it the waveform used to move through the song, with
 * one row per animated setting. It drives the (control-less)
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

  return (
    <section className="ed__time" aria-label="Timeline">
      <div className="pf-transport">
        <button
          type="button"
          className="pf-play"
          disabled={!ready}
          onClick={(e) => player?.toggle(e)}
          aria-label={isPlaying ? "Pause" : "Play"}
          title="Play or pause (Space)"
          style={ready ? undefined : { opacity: 0.4 }}
        >
          {isPlaying ? (
            <Pause className="pf-i" data-solid aria-hidden />
          ) : (
            <Play className="pf-i" data-solid aria-hidden />
          )}
        </button>
        <span className="pf-timecode">
          {formatTime(frame / fps)} <span>/ {formatTime(durationInFrames / fps)}</span>
        </span>
        <span className="pf-sep" />
        <button
          type="button"
          className="pf-track-chip"
          onClick={() => fileInput.current?.click()}
          title={fileName ? `${fileName}: click to load another track` : "Load an audio file"}
        >
          {fileName ? (
            <Music className="pf-i pf-i--sm" aria-hidden />
          ) : (
            <Plus className="pf-i pf-i--sm" aria-hidden />
          )}
          <span>{fileName ?? "Load a track"}</span>
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
        <span className="pf-spacer" />
        <button
          type="button"
          className="pf-btn pf-btn--ghost pf-btn--icon"
          onClick={onToggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <VolumeX className="pf-i" aria-hidden />
          ) : (
            <Volume2 className="pf-i" aria-hidden />
          )}
        </button>
        <span className="pf-sep" />
        <button
          type="button"
          className="pf-btn pf-btn--ghost pf-btn--icon pf-btn--sm"
          disabled={zoomIndex <= 0}
          aria-label="Zoom out of the timeline"
          title="Zoom out"
          onClick={() => setZoom(ZOOMS[zoomIndex - 1])}
        >
          <Minus className="pf-i pf-i--sm" aria-hidden />
        </button>
        <span className="pf-timecode w-6 text-center text-xs">{zoom}x</span>
        <button
          type="button"
          className="pf-btn pf-btn--ghost pf-btn--icon pf-btn--sm"
          disabled={zoomIndex >= ZOOMS.length - 1}
          aria-label="Zoom into the timeline"
          title="Zoom in"
          onClick={() => setZoom(ZOOMS[zoomIndex + 1])}
        >
          <Plus className="pf-i pf-i--sm" aria-hidden />
        </button>
      </div>

      <div className="ed__timeline">
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
    </section>
  );
}
