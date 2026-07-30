import type { ReactNode } from "react";

export function Panel({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`chassis-grain relative rounded-[10px] border border-hairline bg-panel p-4 pt-6 ${className}`}
    >
      <span className="absolute left-3 top-2 font-mono text-[10px] tracking-[0.12em] text-steel uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}
