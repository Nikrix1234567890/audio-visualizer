"use client";

/** An on/off parameter: caption on the left, a small lit switch on the right. */
export function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[11px] tracking-[0.08em] text-steel uppercase">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 shrink-0 rounded-full border outline-none transition-colors focus-visible:border-amber ${
          value ? "border-amber-dim bg-amber-dim" : "border-hairline bg-chassis"
        }`}
      >
        <span
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full shadow-control-raised transition-all ${
            value
              ? "left-[18px] bg-amber shadow-glow-active"
              : "left-0.5 bg-panel-raised"
          }`}
        />
      </button>
    </div>
  );
}
