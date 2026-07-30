"use client";

import { useCallback, useRef, useState } from "react";

// Sweep matches a real rotary pot: 270 degrees, centered with a gap at the
// bottom (from -135deg to +135deg, 0deg pointing straight up).
const START_ANGLE = -135;
const END_ANGLE = 135;
const SWEEP = END_ANGLE - START_ANGLE;
const RADIUS = 32;
const CENTER = 40;
const SIZE = 80;

function polarToCartesian(angleDeg: number, radius: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(angleRad),
    y: CENTER + radius * Math.sin(angleRad),
  };
}

function describeArc(startAngle: number, endAngle: number, radius: number) {
  if (endAngle - startAngle <= 0.001) return "";
  const start = polarToCartesian(startAngle, radius);
  const end = polarToCartesian(endAngle, radius);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function Knob({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ y: number; value: number } | null>(null);

  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const angle = START_ANGLE + fraction * SWEEP;

  const clamp = useCallback(
    (v: number) => Math.min(max, Math.max(min, v)),
    [min, max],
  );

  const snap = useCallback(
    (v: number) => Math.round(v / step) * step,
    [step],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      (e.target as Element).setPointerCapture(e.pointerId);
      dragStart.current = { y: e.clientY, value };
      setIsDragging(true);
    },
    [value],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragStart.current) return;
      const deltaY = dragStart.current.y - e.clientY;
      // 150px of drag traverses the whole range - a comfortable, precise feel.
      const deltaValue = (deltaY / 150) * (max - min);
      onChange(clamp(snap(dragStart.current.value + deltaValue)));
    },
    [max, min, onChange, clamp, snap],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    dragStart.current = null;
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? -1 : 1;
      onChange(clamp(snap(value + direction * step * 5)));
    },
    [value, step, onChange, clamp, snap],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGSVGElement>) => {
      if (e.key === "ArrowUp" || e.key === "ArrowRight") {
        e.preventDefault();
        onChange(clamp(snap(value + step)));
      } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
        e.preventDefault();
        onChange(clamp(snap(value - step)));
      }
    },
    [value, step, onChange, clamp, snap],
  );

  const trackPath = describeArc(START_ANGLE, END_ANGLE, RADIUS);
  const valuePath = describeArc(START_ANGLE, angle, RADIUS);
  const indicator = polarToCartesian(angle, RADIUS - 8);
  const indicatorInner = polarToCartesian(angle, 14);

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        className="cursor-ns-resize touch-none outline-none"
        style={{
          filter: isDragging
            ? "drop-shadow(0 0 10px rgba(255,138,61,0.55))"
            : undefined,
        }}
      >
        {/* track */}
        <path
          d={trackPath}
          fill="none"
          stroke="var(--hairline-steel)"
          strokeWidth={4}
          strokeLinecap="round"
        />
        {/* value fill */}
        <path
          d={valuePath}
          fill="none"
          stroke="var(--patch-amber)"
          strokeWidth={4}
          strokeLinecap="round"
        />
        {/* knob body */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={20}
          fill="var(--panel-graphite-raised)"
          stroke="var(--hairline-steel)"
          strokeWidth={1}
        />
        <circle cx={CENTER} cy={CENTER} r={20} fill="url(#knob-sheen)" />
        {/* indicator line */}
        <line
          x1={indicatorInner.x}
          y1={indicatorInner.y}
          x2={indicator.x}
          y2={indicator.y}
          stroke={isDragging ? "var(--patch-amber)" : "var(--cream-ink)"}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <defs>
          <radialGradient id="knob-sheen" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
      </svg>
      <span className="font-mono text-[11px] tracking-[0.08em] text-steel uppercase">
        {label}
      </span>
      <span className="font-mono text-xs text-cream">
        {formatValue ? formatValue(value) : value.toFixed(2)}
      </span>
    </div>
  );
}
