"use client";

import { useRef } from "react";

const KEY_STEP = 16;

/**
 * A draggable seam between two panels. Drag to resize, double-click to reset,
 * arrow keys to nudge. `vertical` is an upright bar that changes a width;
 * `horizontal` is a flat bar that changes a height.
 */
export function ResizeHandle({
  orientation,
  value,
  min,
  max,
  defaultValue,
  onChange,
  invert = false,
  label,
  className = "",
}: {
  orientation: "vertical" | "horizontal";
  value: number;
  min: number;
  max: number;
  defaultValue: number;
  onChange: (value: number) => void;
  /** Set when dragging towards the top/left should make the panel larger. */
  invert?: boolean;
  label: string;
  className?: string;
}) {
  const drag = useRef<{ position: number; value: number } | null>(null);
  const isVertical = orientation === "vertical";
  const clamp = (v: number) => Math.round(Math.min(max, Math.max(min, v)));

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation={orientation}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      title="Drag to resize, double-click to reset"
      className={`group relative touch-none outline-none ${
        isVertical ? "cursor-col-resize" : "cursor-row-resize"
      } ${className}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = {
          position: isVertical ? e.clientX : e.clientY,
          value,
        };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const delta =
          (isVertical ? e.clientX : e.clientY) - drag.current.position;
        onChange(clamp(drag.current.value + (invert ? -delta : delta)));
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onDoubleClick={() => onChange(defaultValue)}
      onKeyDown={(e) => {
        const grow = isVertical ? "ArrowRight" : "ArrowDown";
        const shrink = isVertical ? "ArrowLeft" : "ArrowUp";
        if (e.key !== grow && e.key !== shrink) return;
        e.preventDefault();
        const direction = (e.key === grow ? 1 : -1) * (invert ? -1 : 1);
        onChange(clamp(value + direction * KEY_STEP));
      }}
    >
      <span
        className={`absolute bg-line-1 transition-colors group-hover:bg-line-3 group-focus-visible:bg-accent group-active:bg-accent ${
          isVertical
            ? "inset-y-0 left-1/2 w-px -translate-x-1/2"
            : "inset-x-0 top-1/2 h-px -translate-y-1/2"
        }`}
      />
    </div>
  );
}
