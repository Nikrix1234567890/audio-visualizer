"use client";

import { useState, type ReactNode } from "react";

const THUMB_RADIUS = 7;

/**
 * One parameter in the sidebar: caption, a fader you can drag, and the exact
 * value as a field you can type into.
 */
export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = "",
  accessory,
  children,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  /** Small control shown right after the caption (e.g. the audio jack). */
  accessory?: ReactNode;
  /** Extra controls belonging to this parameter, shown under the fader. */
  children?: ReactNode;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));

  const snap = (raw: number) => {
    const stepped = Math.round((raw - min) / step) * step + min;
    return Math.min(max, Math.max(min, Number(stepped.toFixed(4))));
  };

  const setFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const usable = rect.width - THUMB_RADIUS * 2;
    const position = (e.clientX - rect.left - THUMB_RADIUS) / usable;
    onChange(snap(min + position * (max - min)));
  };

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = Number(draft.replace(",", "."));
    if (Number.isFinite(parsed)) onChange(snap(parsed));
    setDraft(null);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
            {label}
          </span>
          {accessory}
        </span>
        <span className="flex shrink-0 items-baseline font-mono text-[13px] text-ink">
          <input
            aria-label={`${label} value`}
            inputMode="decimal"
            value={draft ?? value.toFixed(decimals)}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setDraft(null);
                e.currentTarget.blur();
              }
            }}
            className="w-14 border-b border-transparent bg-transparent text-right outline-none hover:border-line focus:border-accent"
          />
          {unit && <span className="pl-0.5 text-muted">{unit}</span>}
        </span>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="group relative h-5 cursor-pointer touch-none outline-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromPointer(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromPointer(e);
        }}
        onKeyDown={(e) => {
          const amount = step * (e.shiftKey ? 10 : 1);
          let next: number | null = null;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") next = value + amount;
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = value - amount;
          if (e.key === "Home") next = min;
          if (e.key === "End") next = max;
          if (next === null) return;
          e.preventDefault();
          onChange(snap(next));
        }}
      >
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-line"
          style={{ left: THUMB_RADIUS, right: THUMB_RADIUS }}
        />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent-dim group-hover:bg-accent group-focus-visible:bg-accent group-active:bg-accent"
          style={{
            left: THUMB_RADIUS,
            width: `calc((100% - ${THUMB_RADIUS * 2}px) * ${ratio})`,
          }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-surface-raised shadow-control-raised group-hover:border-accent-dim group-focus-visible:border-accent group-focus-visible:shadow-glow-active group-active:border-accent group-active:shadow-glow-active"
          style={{
            left: `calc(${THUMB_RADIUS}px + (100% - ${THUMB_RADIUS * 2}px) * ${ratio})`,
          }}
        />
      </div>
      {children}
    </div>
  );
}
