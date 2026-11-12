"use client";

import type { MediaUtilsAudioData } from "@remotion/media-utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { getTrackAnalysis } from "../../../remotion/audio/analysis";
import { RangeOverlay } from "@/components/editor/RangeOverlay";
import { TimeDiamond, type TimelineView } from "@/components/editor/TimeDiamond";
import type { ExportRange } from "@/lib/visualizerSettings";

const PEAK_BUCKETS = 8000;
const BAR_WIDTH = 2;
const BAR_GAP = 1;
const SEEK_KEY_SECONDS = 5;

// A canvas cannot read CSS variables cheaply per frame; these mirror the
// tokens in globals.css (accent, ink-4, sig-beat, accent).
const COLOR_PLAYED = "#3ee6c1";
const COLOR_UNPLAYED = "#596070";
const COLOR_BEAT = "rgba(255, 95, 196, 0.8)";
const COLOR_PLAYHEAD = "#3ee6c1";

/** Whose keyframe a timeline marker stands for. */
export type MarkerOwner = "element" | "camera" | "look";
export type TimelineMarker = { owner: MarkerOwner; label: string; t: number };

export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Loudest sample per bucket across the whole track, normalised to 0..1. */
function computePeaks(audioData: MediaUtilsAudioData): Float32Array {
  const peaks = new Float32Array(PEAK_BUCKETS);
  const length = audioData.channelWaveforms[0].length;
  const perBucket = length / PEAK_BUCKETS;
  let loudest = 0;

  for (const channel of audioData.channelWaveforms) {
    for (let b = 0; b < PEAK_BUCKETS; b++) {
      const end = Math.min(length, Math.floor((b + 1) * perBucket));
      let peak = peaks[b];
      for (let i = Math.floor(b * perBucket); i < end; i++) {
        const v = channel[i] < 0 ? -channel[i] : channel[i];
        if (v > peak) peak = v;
      }
      peaks[b] = peak;
      if (peak > loudest) loudest = peak;
    }
  }

  if (loudest > 0) {
    for (let b = 0; b < PEAK_BUCKETS; b++) peaks[b] /= loudest;
  }
  return peaks;
}

/** Position of every detected beat as a fraction (0..1) of the track. */
function computeBeats(audioData: MediaUtilsAudioData): number[] {
  const { beatCount, stepCount } = getTrackAnalysis(audioData);
  const beats: number[] = [];
  for (let step = 1; step < stepCount; step++) {
    if (beatCount[step] > beatCount[step - 1]) beats.push(step / stepCount);
  }
  return beats;
}

/**
 * The track as a waveform you navigate with: click or drag to seek. Small
 * ticks along the bottom mark the beats the visualizer reacts to (the same
 * analysis the scenes use, see remotion/audio/analysis.ts). Diamonds along
 * the top are keyframes: click one to go there, drag it to another moment.
 *
 * `view` is the stretch of the track that is shown - the whole track, or a
 * part of it when zoomed in.
 */
export function Waveform({
  audioData,
  frame,
  durationInFrames,
  fps,
  view,
  onSeek,
  markers,
  onMoveMarker,
  range,
  onRangeChange,
}: {
  audioData: MediaUtilsAudioData | null;
  frame: number;
  durationInFrames: number;
  fps: number;
  view: TimelineView;
  onSeek: (frame: number) => void;
  markers: TimelineMarker[];
  onMoveMarker: (owner: MarkerOwner, from: number, to: number) => void;
  /** The section that will be exported, or null for the whole track. */
  range: ExportRange | null;
  onRangeChange: (range: ExportRange) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const peaks = useMemo(
    () => (audioData ? computePeaks(audioData) : null),
    [audioData],
  );
  const beats = useMemo(
    () => (audioData ? computeBeats(audioData) : []),
    [audioData],
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const seconds = frame / fps;
  const duration = durationInFrames / fps;
  // Where the view begins and ends, as fractions of the whole track.
  const viewFrom = duration > 0 ? view.start / duration : 0;
  const viewSpan = duration > 0 ? view.length / duration : 1;
  const progress = (seconds - view.start) / view.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    const { width, height } = size;
    if (!canvas || width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    // Assigning a canvas size - even the same one - throws away its pixel
    // buffer and allocates a new one, so only do it when the size changed.
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!peaks) return;

    const beatLane = 6;
    const waveHeight = height - beatLane;
    const middle = waveHeight / 2;
    const barCount = Math.floor(width / (BAR_WIDTH + BAR_GAP));
    const playheadX = progress * width;

    for (let i = 0; i < barCount; i++) {
      const from = Math.floor((viewFrom + (i / barCount) * viewSpan) * PEAK_BUCKETS);
      const to = Math.max(
        from + 1,
        Math.floor((viewFrom + ((i + 1) / barCount) * viewSpan) * PEAK_BUCKETS),
      );
      let peak = 0;
      for (let b = from; b < to && b < PEAK_BUCKETS; b++) if (peaks[b] > peak) peak = peaks[b];

      const x = i * (BAR_WIDTH + BAR_GAP);
      const half = Math.max(0.5, peak * (middle - 1));
      ctx.fillStyle = x < playheadX ? COLOR_PLAYED : COLOR_UNPLAYED;
      ctx.fillRect(x, middle - half, BAR_WIDTH, half * 2);
    }

    ctx.fillStyle = COLOR_BEAT;
    for (const beat of beats) {
      const at = (beat - viewFrom) / viewSpan;
      if (at < 0 || at > 1) continue;
      ctx.fillRect(Math.round(at * width), height - beatLane + 2, 1, beatLane - 2);
    }

    if (progress >= 0 && progress <= 1) {
      ctx.fillStyle = COLOR_PLAYHEAD;
      ctx.fillRect(Math.round(playheadX), 0, 1, height);
    }
  }, [peaks, beats, size, progress, viewFrom, viewSpan]);

  const seekFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const position = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const target = Math.round((view.start + position * view.length) * fps);
    onSeek(Math.min(durationInFrames - 1, Math.max(0, target)));
  };

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={audioData ? 0 : -1}
      aria-label="Playback position"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(seconds)}
      aria-valuetext={`${formatTime(seconds)} of ${formatTime(duration)}`}
      className={`ed__wave h-full w-full touch-none ${
        audioData ? "cursor-pointer" : ""
      }`}
      onPointerDown={(e) => {
        if (!audioData) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        seekFromPointer(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) seekFromPointer(e);
      }}
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const direction = e.key === "ArrowRight" ? 1 : -1;
        const next = frame + direction * SEEK_KEY_SECONDS * fps;
        onSeek(Math.min(durationInFrames - 1, Math.max(0, Math.round(next))));
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {audioData && range && (
        <RangeOverlay range={range} view={view} duration={duration} onChange={onRangeChange} />
      )}
      {audioData && (
        // The combined row: one diamond per moment at which the selected
        // element, the camera or the look has a keyframe.
        <div className="absolute inset-x-0 top-0 h-4">
          {markers
            .filter((marker) => marker.t <= duration)
            .map((marker) => (
              <TimeDiamond
                key={`${marker.owner}:${marker.t}`}
                t={marker.t}
                view={view}
                label={marker.label}
                isFilled={marker.owner === "element"}
                onGo={(t) => onSeek(Math.round(t * fps))}
                onMove={(to) => onMoveMarker(marker.owner, marker.t, to)}
              />
            ))}
        </div>
      )}
      {!audioData && (
        <span className="pf-note absolute inset-0 flex items-center justify-center px-4 text-center">
          The waveform and your keyframes appear here once a track is loaded.
        </span>
      )}
    </div>
  );
}
