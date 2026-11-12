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

/** The mark alone: a sound figure, small dots at the corners, the largest in the middle. */
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      {DOTS.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  );
}

/** The logo: the mark in the accent colour and the name in the display face. */
export function Wordmark({
  className = "",
  markOnly = false,
}: {
  className?: string;
  /** Only the mark, with the name left for screen readers (the editor's top bar). */
  markOnly?: boolean;
}) {
  return (
    <span className={`pf-logo ${className}`}>
      <Mark />
      {markOnly ? <span className="sr-only">{BRAND.name}</span> : <span>{BRAND.name}</span>}
    </span>
  );
}
