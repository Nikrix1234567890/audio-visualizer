"use client";

/** A short text parameter: label above, a single-line field below. */
export function TextRow({
  label,
  value,
  maxLength,
  onChange,
}: {
  label: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="pf-field">
      <span className="pf-rowlabel">{label}</span>
      <input
        value={value}
        maxLength={maxLength}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        className="pf-input"
      />
    </label>
  );
}
