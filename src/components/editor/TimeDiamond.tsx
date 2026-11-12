"use client";

import { useState } from "react";

/** The stretch of the track a timeline currently shows, in seconds. */
export type TimelineView = { start: number; length: number };

/** A diamond dragged less far than this (in pixels) was clicked, not moved. */
const DRAG_THRESHOLD = 3;

/**
 * A keyframe on a timeline: a diamond at its moment. Click to go there,
 * drag to move it, hold Alt while dragging to leave a copy behind. It
 * positions itself inside its parent, which must span the whole `view`.
 */
export function TimeDiamond({
  t,
  view,
  label,
  isFilled,
  canCopy = false,
  onGo,
  onMove,
}: {
  t: number;
  view: TimelineView;
  label: string;
  isFilled: boolean;
  /** Whether Alt-dragging copies (lanes) or just moves (the combined row). */
  canCopy?: boolean;
  onGo: (seconds: number) => void;
  onMove: (to: number, copy: boolean) => void;
}) {
  // While dragging: where the pointer went down and the moment held now.
  const [drag, setDrag] = useState<{ startX: number; t: number | null } | null>(null);
  const shown = drag?.t ?? t;
  const position = (shown - view.start) / view.length;
  if (position < 0 || position > 1) return null;

  const timeAt = (clientX: number, target: HTMLElement) => {
    const rect = (target.parentElement as HTMLElement).getBoundingClientRect();
    const at = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round((view.start + at * view.length) * 1000) / 1000;
  };

  return (
    <button
      type="button"
      aria-label={`${label} keyframe at ${shown.toFixed(1)} seconds`}
      title={`${label} · ${shown.toFixed(2)} s - click to go there, drag to move${
        canCopy ? ", Alt-drag to copy" : ""
      }`}
      style={{ left: `${position * 100}%` }}
      className="pf-kfbtn"
      data-own={isFilled || undefined}
      onPointerDown={(e) => {
        // Not a seek: the diamond handles its own click and drag.
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag({ startX: e.clientX, t: null });
      }}
      onPointerMove={(e) => {
        if (!drag) return;
        if (drag.t === null && Math.abs(e.clientX - drag.startX) < DRAG_THRESHOLD) return;
        setDrag({ ...drag, t: timeAt(e.clientX, e.currentTarget) });
      }}
      onPointerUp={(e) => {
        if (!drag) return;
        if (drag.t === null) onGo(t);
        else if (drag.t !== t) onMove(drag.t, canCopy && e.altKey);
        setDrag(null);
      }}
      onPointerCancel={() => setDrag(null)}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        e.stopPropagation();
        onGo(t);
      }}
    >
      <span />
    </button>
  );
}
