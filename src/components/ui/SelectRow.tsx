"use client";

/** A labelled drop-down for a parameter with a fixed list of choices. */
export function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="pf-inlinefield">
      <span className="pf-rowlabel">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="pf-select">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
