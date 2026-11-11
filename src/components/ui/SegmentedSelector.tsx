export function SegmentedSelector<T extends string | number>({
  options,
  value,
  onChange,
  stretch = false,
  onLocked,
}: {
  /** A `locked` option is shown dimmed and cannot be chosen (see `onLocked`). */
  options: { value: T; label: string; locked?: boolean }[];
  value: T;
  onChange: (value: T) => void;
  /** Fill the available width with equally wide segments (sidebar use). */
  stretch?: boolean;
  /** Called instead of `onChange` when a locked option is clicked. */
  onLocked?: (value: T) => void;
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
            aria-disabled={option.locked || undefined}
            title={option.locked ? "Premium" : undefined}
            onClick={() =>
              option.locked ? onLocked?.(option.value) : onChange(option.value)
            }
            className={`rounded-full py-1.5 font-mono text-[11px] leading-tight tracking-[0.06em] uppercase outline-none transition-all focus-visible:text-amber ${
              stretch ? "min-w-0 flex-1 px-1.5" : "px-3"
            } ${
              isActive
                ? "bg-panel-raised text-amber shadow-glow-active"
                : option.locked
                  ? "cursor-not-allowed text-steel opacity-40"
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
