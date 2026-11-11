"use client";

/** A short text parameter: caption above, a single-line field below. */
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
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] tracking-[0.08em] text-steel uppercase">
        {label}
      </span>
      <input
        value={value}
        maxLength={maxLength}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-hairline bg-chassis px-2.5 py-1.5 text-sm text-cream shadow-scope-recessed outline-none focus:border-amber"
      />
    </label>
  );
}
