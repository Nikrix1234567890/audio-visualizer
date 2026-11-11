"use client";

import type { Keyframe } from "../../../remotion/scene/definitions";
import { TimeDiamond, type TimelineView } from "@/components/editor/TimeDiamond";
import type { MarkerOwner } from "@/components/editor/Waveform";

/** One animated setting and its keyframes. */
export type TimelineLane = {
  owner: MarkerOwner;
  /** The keyframe target, e.g. "radius" or "position.0". */
  target: string;
  label: string;
  keys: Keyframe[];
};

/**
 * One row per animated setting, under the waveform and on the same time
 * axis: every keyframe as a diamond that can be clicked, dragged and
 * Alt-dragged to copy. A thin line marks the playhead.
 */
export function KeyframeLanes({
  lanes,
  view,
  seconds,
  onGo,
  onMoveKey,
}: {
  lanes: TimelineLane[];
  view: TimelineView;
  /** Where the playhead is. */
  seconds: number;
  onGo: (seconds: number) => void;
  onMoveKey: (lane: TimelineLane, from: number, to: number, copy: boolean) => void;
}) {
  const playhead = (seconds - view.start) / view.length;

  return (
    <ul className="flex max-h-28 shrink-0 flex-col overflow-y-auto rounded-md bg-canvas shadow-scope-recessed">
      {lanes.map((lane) => (
        <li
          key={`${lane.owner}:${lane.target}`}
          className="relative h-5 shrink-0 border-b border-line/60 last:border-b-0"
        >
          <span className="pointer-events-none absolute top-1/2 right-1.5 z-10 -translate-y-1/2 font-mono text-[9px] tracking-[0.08em] text-muted uppercase">
            {lane.label}
          </span>
          {playhead >= 0 && playhead <= 1 && (
            <span
              aria-hidden
              className="pointer-events-none absolute top-0 h-full w-px bg-ink/40"
              style={{ left: `${playhead * 100}%` }}
            />
          )}
          {lane.keys.map((key) => (
            <TimeDiamond
              key={key.t}
              t={key.t}
              view={view}
              label={lane.label}
              isFilled={lane.owner === "element"}
              canCopy
              onGo={onGo}
              onMove={(to, copy) => onMoveKey(lane, key.t, to, copy)}
            />
          ))}
        </li>
      ))}
    </ul>
  );
}
