"use client";

import { useState } from "react";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * A colour parameter: caption, a swatch that opens the system colour picker,
 * and the hex value as an editable readout.
 */
export function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const commitDraft = () => {
    if (draft === null) return;
    const candidate = draft.startsWith("#") ? draft : `#${draft}`;
    if (HEX_COLOR.test(candidate)) onChange(candidate.toLowerCase());
    setDraft(null);
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
        {label}
      </span>
      <span className="flex items-center gap-2">
        <input
          aria-label={`${label} hex value`}
          value={draft ?? value}
          spellCheck={false}
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
          className="w-[4.5rem] border-b border-transparent bg-transparent text-right font-mono text-[13px] text-ink outline-none hover:border-line focus:border-accent"
        />
        <label
          className="relative h-5 w-7 shrink-0 cursor-pointer overflow-hidden rounded-md border border-line shadow-control-raised focus-within:border-accent"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            aria-label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </span>
    </div>
  );
}
