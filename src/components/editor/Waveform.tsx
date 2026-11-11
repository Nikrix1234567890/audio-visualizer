"use client";

import type { MediaUtilsAudioData } from "@remotion/media-utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { getTrackAnalysis } from "../../../remotion/audio/analysis";

const PEAK_BUCKETS = 4000;
const BAR_WIDTH = 2;
const BAR_GAP = 1;
const SEEK_KEY_SECONDS = 5;

// Canvas cannot read CSS variables cheaply per frame; these mirror DESIGN.md.
const COLOR_PLAYED = "#ff8a3d";
const COLOR_UNPLAYED = "#3d3d48";
const COLOR_BEAT = "rgba(242, 237, 226, 0.45)";
const COLOR_PLAYHEAD = "#f2ede2";

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
 * analysis the scenes use, see remotion/audio/analysis.ts).
 */
export function Waveform({
  audioData,
  frame,
  durationInFrames,
  fps,
  onSeek,
}: {
  audioData: MediaUtilsAudioData | null;
  frame: number;
  durationInFrames: number;
  fps: number;
  onSeek: (frame: number) => void;
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

  const progress = durationInFrames > 1 ? frame / (durationInFrames - 1) : 0;

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
      const from = Math.floor((i / barCount) * PEAK_BUCKETS);
      const to = Math.max(from + 1, Math.floor(((i + 1) / barCount) * PEAK_BUCKETS));
      let peak = 0;
      for (let b = from; b < to; b++) if (peaks[b] > peak) peak = peaks[b];

      const x = i * (BAR_WIDTH + BAR_GAP);
      const half = Math.max(0.5, peak * (middle - 1));
      ctx.fillStyle = x < playheadX ? COLOR_PLAYED : COLOR_UNPLAYED;
      ctx.fillRect(x, middle - half, BAR_WIDTH, half * 2);
    }

    ctx.fillStyle = COLOR_BEAT;
    for (const beat of beats) {
      ctx.fillRect(Math.round(beat * width), height - beatLane + 2, 1, beatLane - 2);
    }

    ctx.fillStyle = COLOR_PLAYHEAD;
    ctx.fillRect(Math.round(playheadX), 0, 1, height);
  }, [peaks, beats, size, progress]);

  const seekFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const position = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(Math.round(position * (durationInFrames - 1)));
  };

  const seconds = frame / fps;
  const duration = durationInFrames / fps;

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
      className={`relative h-full min-h-12 w-full touch-none rounded-md bg-chassis shadow-scope-recessed outline-none focus-visible:ring-1 focus-visible:ring-amber ${
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
      {!audioData && (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] tracking-[0.08em] text-steel uppercase">
          No track loaded
        </span>
      )}
    </div>
  );
}
