"use client";

/** A text parameter with several rows: label above, a text area below. */
export function LinesRow({
  label,
  value,
  maxLength,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  maxLength: number;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="pf-field">
      <span className="pf-rowlabel">{label}</span>
      <textarea
        value={value}
        maxLength={maxLength}
        rows={7}
        spellCheck={false}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="pf-input"
      />
    </label>
  );
}
