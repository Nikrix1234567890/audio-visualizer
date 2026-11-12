"use client";

import { SegmentedSelector } from "@/components/ui/SegmentedSelector";
import { MIN_RANGE_SECONDS, type ExportRange } from "@/lib/visualizerSettings";
import { usePlayhead } from "./Playhead";
import { formatTime } from "./Waveform";

/** Lengths short-video feeds ask for, in seconds. */
const PRESETS = [15, 30, 60];

const round = (seconds: number) => Math.round(seconds * 100) / 100;

/**
 * Chooses how much of the track is exported: all of it, or a section - for
 * Reels, Shorts and TikTok, and because a short video renders much sooner.
 * The section is also shown on the timeline, where its edges can be dragged.
 */
export function ExportLength({
  range,
  duration,
  onChange,
}: {
  /** The chosen section, or null for the whole track. */
  range: ExportRange | null;
  /** Length of the track in seconds; 0 while none is loaded. */
  duration: number;
  onChange: (range: ExportRange | null) => void;
}) {
  const playhead = usePlayhead();
  const hasTrack = duration >= MIN_RANGE_SECONDS;

  /** A section of `length` seconds from the playhead, moved back if it would overrun. */
  const fromPlayhead = (length: number): ExportRange => {
    const span = Math.min(length, duration);
    const start = Math.max(0, Math.min(playhead.now(), duration - span));
    return { start: round(start), end: round(start + span) };
  };

  const small =
    "min-w-0 flex-1 rounded-md border border-line px-1.5 py-1.5 font-mono text-[11px] tracking-[0.06em] text-ink uppercase outline-none hover:border-accent-dim hover:text-accent focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <>
      <SegmentedSelector
        stretch
        options={[
          { value: "all", label: "Whole track" },
          { value: "section", label: "Section" },
        ]}
        value={range ? "section" : "all"}
        onChange={(next) => {
          if (next === "all") onChange(null);
          else if (!range && hasTrack) onChange(fromPlayhead(30));
        }}
      />
      {range && (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] tracking-[0.06em] text-muted tabular-nums">
            {formatTime(range.start)} - {formatTime(range.end)} ·{" "}
            <span className="text-ink">{Math.round(range.end - range.start)} s</span>
          </p>
          <div className="flex gap-1">
            {PRESETS.map((length) => (
              <button
                key={length}
                type="button"
                className={small}
                title={`${length} seconds from the playhead`}
                onClick={() => onChange(fromPlayhead(length))}
              >
                {length} s
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className={small}
              title="Start the section at the playhead"
              onClick={() => {
                const start = round(Math.min(playhead.now(), duration - MIN_RANGE_SECONDS));
                // Starting after the old end keeps the length and moves on.
                const end =
                  range.end - start >= MIN_RANGE_SECONDS
                    ? range.end
                    : Math.min(duration, start + (range.end - range.start));
                onChange({ start, end: round(end) });
              }}
            >
              Start here
            </button>
            <button
              type="button"
              className={small}
              title="End the section at the playhead"
              onClick={() => {
                const end = round(Math.max(playhead.now(), MIN_RANGE_SECONDS));
                const start =
                  end - range.start >= MIN_RANGE_SECONDS
                    ? range.start
                    : Math.max(0, end - (range.end - range.start));
                onChange({ start: round(start), end });
              }}
            >
              End here
            </button>
          </div>
          <p className="text-xs text-muted">
            The buttons start from the playhead. Drag the two lines on the
            timeline to adjust.
          </p>
        </div>
      )}
    </>
  );
}
