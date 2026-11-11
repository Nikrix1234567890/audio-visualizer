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
    <label className="flex items-center justify-between gap-3">
      <span className="font-mono text-[11px] tracking-[0.08em] text-steel uppercase">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 max-w-[60%] flex-1 rounded-md border border-hairline bg-chassis px-2 py-1.5 text-sm text-cream shadow-scope-recessed outline-none focus:border-amber"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
