"use client";

import { useState } from "react";

/**
 * The picture of a saved project. It is drawn a moment after saving, so it
 * may not exist yet (or the render bundle may be missing): then a plain
 * tile is shown instead of a broken image.
 */
export function ProjectThumb({ src }: { src: string }) {
  const [isMissing, setIsMissing] = useState(false);

  return (
    <span className="block h-[54px] w-24 shrink-0 overflow-hidden rounded-md border border-line bg-canvas">
      {!isMissing && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={96}
          height={54}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setIsMissing(true)}
        />
      )}
    </span>
  );
}
