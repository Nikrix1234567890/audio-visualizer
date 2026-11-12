"use client";

import { useState } from "react";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * A colour parameter: a chip that opens the system colour picker, the
 * parameter's name, and the hex value as a field you can type into.
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
    <div className="pf-color">
      <label className="pf-color__chip" style={{ background: value }}>
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <span className="pf-color__label">{label}</span>
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
        className="pf-color__hex"
      />
    </div>
  );
}
