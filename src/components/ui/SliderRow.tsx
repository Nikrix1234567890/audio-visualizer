"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";

/** How far the pointer has to travel before a press counts as a drag. */
const DRAG_THRESHOLD = 3;

/**
 * One number in the inspector, as a scrub field: the field is the slider.
 * Its fill shows the value inside its range; drag sideways to change it
 * (Shift for fine steps), double-click or press Enter to type, arrow keys
 * step (Shift: ten steps).
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
  signal,
  modulation = 0,
  isActive = false,
  children,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  /** Small controls right of the field (the audio jack, the keyframe diamond). */
  accessory?: ReactNode;
  /** The audio signal that drives this value ("bass", "mid", "high", "level", "beat"). */
  signal?: string;
  /** How far that signal pushes the value, in the value's own unit. */
  modulation?: number;
  /** Lit: a keyframe sits at the playhead, or a panel of this row is open. */
  isActive?: boolean;
  /** What belongs to this parameter and opens under it. */
  children?: ReactNode;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const drag = useRef<{ x: number; value: number; moved: boolean } | null>(null);
  const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
  const range = max - min;
  const ratio = Math.min(1, Math.max(0, (value - min) / range));

  const snap = (raw: number) => {
    const stepped = Math.round((raw - min) / step) * step + min;
    return Math.min(max, Math.max(min, Number(stepped.toFixed(4))));
  };

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = Number(draft.replace(",", "."));
    if (Number.isFinite(parsed)) onChange(snap(parsed));
    setDraft(null);
  };

  // The stretch the audio adds on top of the value, as a share of the range.
  const swing = Math.max(-ratio, Math.min(1 - ratio, modulation / range));
  const modStyle: CSSProperties = {
    left: `${Math.min(ratio, ratio + swing) * 100}%`,
    width: `${Math.abs(swing) * 100}%`,
  };

  return (
    <div className="pf-paramrow">
      <div className="pf-param">
        <div
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value.toFixed(decimals)}${unit}`}
          title="Drag to change, double-click to type"
          className="pf-scrub"
          data-active={isActive || draft !== null || undefined}
          style={{ "--v": ratio } as CSSProperties}
          onPointerDown={(e) => {
            if (draft !== null) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, value, moved: false };
          }}
          onPointerMove={(e) => {
            const held = drag.current;
            if (!held) return;
            const dx = e.clientX - held.x;
            if (!held.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
            held.moved = true;
            const width = e.currentTarget.getBoundingClientRect().width;
            onChange(snap(held.value + (dx / width) * range * (e.shiftKey ? 0.1 : 1)));
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onDoubleClick={() => setDraft(value.toFixed(decimals))}
          onKeyDown={(e) => {
            if (draft !== null) return;
            if (e.key === "Enter") {
              e.preventDefault();
              setDraft(value.toFixed(decimals));
              return;
            }
            const amount = step * (e.shiftKey ? 10 : 1);
            let next: number | null = null;
            if (e.key === "ArrowRight" || e.key === "ArrowUp") next = value + amount;
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = value - amount;
            if (e.key === "Home") next = min;
            if (e.key === "End") next = max;
            if (next === null) return;
            e.preventDefault();
            e.stopPropagation();
            onChange(snap(next));
          }}
        >
          <span className="pf-scrub__label">{label}</span>
          {draft !== null ? (
            <input
              autoFocus
              aria-label={`${label} value`}
              inputMode="decimal"
              value={draft}
              className="pf-scrub__input"
              onChange={(e) => setDraft(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={commitDraft}
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") commitDraft();
                if (e.key === "Escape") setDraft(null);
              }}
            />
          ) : (
            <span className="pf-scrub__value">
              {value.toFixed(decimals)}
              {unit && <small>{unit}</small>}
            </span>
          )}
          {signal && modulation !== 0 && (
            <span className="pf-scrub__mod" data-sig={signal} style={modStyle} />
          )}
        </div>
        {accessory}
      </div>
      {children}
    </div>
  );
}
