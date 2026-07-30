export function SegmentedSelector<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1.5 rounded-full border border-hairline p-1">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase transition-all ${
              isActive
                ? "bg-panel-raised text-amber shadow-[0_0_16px_rgba(255,138,61,0.45)]"
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
