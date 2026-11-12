"use client";

import { MIN_RANGE_SECONDS, type ExportRange } from "@/lib/visualizerSettings";
import type { TimelineView } from "./TimeDiamond";

/**
 * The section of the track that will be exported, drawn over the waveform:
 * everything outside it is dimmed, and its two edges can be dragged. It
 * fills its parent, which must span the whole `view`. Only the edges take
 * the pointer - a click anywhere else still moves the playhead.
 */
export function RangeOverlay({
  range,
  view,
  duration,
  onChange,
}: {
  range: ExportRange;
  view: TimelineView;
  /** Length of the track in seconds. */
  duration: number;
  onChange: (range: ExportRange) => void;
}) {
  const at = (seconds: number) =>
    Math.min(1, Math.max(0, (seconds - view.start) / view.length));
  const from = at(range.start);
  const to = at(Math.min(range.end, duration));

  const edge = (side: "start" | "end") => {
    const seconds = side === "start" ? range.start : Math.min(range.end, duration);
    const position = (seconds - view.start) / view.length;
    // An edge outside the shown stretch (zoomed in) has no handle here.
    if (position < 0 || position > 1) return null;
    const move = (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
      const share = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const t = Math.round((view.start + share * view.length) * 100) / 100;
      onChange(
        side === "start"
          ? { start: Math.max(0, Math.min(t, range.end - MIN_RANGE_SECONDS)), end: range.end }
          : {
              start: range.start,
              end: Math.min(duration, Math.max(t, range.start + MIN_RANGE_SECONDS)),
            },
      );
    };
    return (
      <div
        role="slider"
        tabIndex={0}
        aria-label={side === "start" ? "Start of the exported section" : "End of the exported section"}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(seconds)}
        title={`${side === "start" ? "Start" : "End"} of the exported section - drag to move`}
        style={{ left: `${position * 100}%` }}
        className="group/edge pointer-events-auto absolute inset-y-0 flex w-3 -translate-x-1/2 cursor-ew-resize touch-none justify-center outline-none"
        onPointerDown={(e) => {
          // Not a seek: the edge handles its own drag.
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e);
        }}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          // Not a seek either (the waveform listens for the same keys).
          e.preventDefault();
          e.stopPropagation();
          const t = seconds + (e.key === "ArrowRight" ? 1 : -1);
          onChange(
            side === "start"
              ? { start: Math.max(0, Math.min(t, range.end - MIN_RANGE_SECONDS)), end: range.end }
              : {
                  start: range.start,
                  end: Math.min(duration, Math.max(t, range.start + MIN_RANGE_SECONDS)),
                },
          );
        }}
      >
        <span className="h-full w-0.5 bg-accent group-hover/edge:w-1 group-focus-visible/edge:w-1" />
      </div>
    );
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[6px]">
      <div className="absolute inset-y-0 left-0 bg-bg-0/70" style={{ width: `${from * 100}%` }} />
      <div className="absolute inset-y-0 right-0 bg-bg-0/70" style={{ width: `${(1 - to) * 100}%` }} />
      {edge("start")}
      {edge("end")}
    </div>
  );
}
