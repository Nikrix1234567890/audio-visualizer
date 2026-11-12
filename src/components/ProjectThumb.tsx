"use client";

import { useState } from "react";

/**
 * The picture of a saved project. It is drawn a moment after saving, so it
 * may not exist yet (or the render bundle may be missing): then a plain
 * tile is shown instead of a broken image.
 */
export function ProjectThumb({ src, className = "thumb" }: { src: string; className?: string }) {
  const [isMissing, setIsMissing] = useState(false);

  if (isMissing) return <span className={`${className} block`} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={480}
      height={270}
      loading="lazy"
      className={className}
      onError={() => setIsMissing(true)}
    />
  );
}
