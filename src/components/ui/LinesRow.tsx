"use client";

/** A text parameter with several rows: caption above, a text area below. */
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
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
        {label}
      </span>
      <textarea
        value={value}
        maxLength={maxLength}
        rows={7}
        spellCheck={false}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="resize-y rounded-md border border-line bg-canvas px-2.5 py-1.5 font-mono text-xs leading-relaxed text-ink shadow-scope-recessed outline-none focus:border-accent"
      />
    </label>
  );
}
