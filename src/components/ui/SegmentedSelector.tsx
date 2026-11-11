export function SegmentedSelector<T extends string | number>({
  options,
  value,
  onChange,
  stretch = false,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Fill the available width with equally wide segments (sidebar use). */
  stretch?: boolean;
}) {
  return (
    <div
      className={`gap-1 rounded-full border border-hairline p-1 ${
        stretch ? "flex w-full" : "inline-flex flex-wrap"
      }`}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`rounded-full py-1.5 font-mono text-[11px] leading-tight tracking-[0.06em] uppercase outline-none transition-all focus-visible:text-amber ${
              stretch ? "min-w-0 flex-1 px-1.5" : "px-3"
            } ${
              isActive
                ? "bg-panel-raised text-amber shadow-glow-active"
                : "text-steel hover:text-cream"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
