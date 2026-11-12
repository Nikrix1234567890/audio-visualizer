import { BRAND } from "../../remotion/brand";

/** The nine dots of the mark: [centre x, centre y, radius] on a 48 x 48 grid. */
const DOTS = [
  [9, 9, 3],
  [24, 9, 5],
  [39, 9, 3],
  [9, 24, 5],
  [24, 24, 8],
  [39, 24, 5],
  [9, 39, 3],
  [24, 39, 5],
  [39, 39, 3],
];

/** The logo: the nine-dot sound figure and the name, its second half in the brand gradient. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight text-ink ${className}`}>
      <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden>
        <defs>
          <linearGradient id="wordmark-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* A sound figure: small dots at the corners, the largest in the middle. */}
        {DOTS.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="url(#wordmark-gradient)" />
        ))}
      </svg>
      <span>
        {BRAND.first}
        <span className="text-brand">{BRAND.second}</span>
      </span>
    </span>
  );
}
