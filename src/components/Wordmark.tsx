import { BRAND } from "../../remotion/brand";

/** The logo: a small pulse mark and the name, its second half in the brand gradient. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight text-ink ${className}`}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <defs>
          <linearGradient id="wordmark-gradient" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* Five bars of a spectrum, rising and falling like one pulse. */}
        {[
          [1, 8, 4],
          [5, 4, 12],
          [9, 1, 18],
          [13, 5, 10],
          [17, 8, 4],
        ].map(([x, y, height]) => (
          <rect
            key={x}
            x={x}
            y={y}
            width="2"
            height={height}
            rx="1"
            fill="url(#wordmark-gradient)"
          />
        ))}
      </svg>
      <span>
        {BRAND.first}
        <span className="text-brand">{BRAND.second}</span>
      </span>
    </span>
  );
}
