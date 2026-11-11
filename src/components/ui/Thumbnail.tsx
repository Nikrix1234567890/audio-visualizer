"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A 16:9 preview picture from public/thumbnails (made by `pnpm thumbnails`).
 * `dimmed` pictures light up when their card is hovered or focused. With
 * `video` (a loop from public/previews, made by `pnpm previews`) the
 * picture starts moving while its card - the nearest ancestor with the
 * `group` class - is hovered or focused; the loop is only downloaded then.
 */
export function Thumbnail({
  src,
  video,
  dimmed = false,
}: {
  src: string;
  video?: string;
  dimmed?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const card = ref.current?.closest(".group");
    if (!video || !card) return;
    const on = () => setIsActive(true);
    const off = () => setIsActive(false);
    card.addEventListener("pointerenter", on);
    card.addEventListener("pointerleave", off);
    card.addEventListener("focusin", on);
    card.addEventListener("focusout", off);
    return () => {
      card.removeEventListener("pointerenter", on);
      card.removeEventListener("pointerleave", off);
      card.removeEventListener("focusin", on);
      card.removeEventListener("focusout", off);
    };
  }, [video]);

  return (
    <span ref={ref} className="relative block aspect-video w-full bg-canvas">
      {/* A small static file from the public folder of this app: the image
          optimiser would add a request round trip and gain nothing. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        width={480}
        height={270}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
          dimmed ? "opacity-75 group-hover:opacity-100 group-focus-visible:opacity-100" : ""
        }`}
      />
      {video && isActive && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={video}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      )}
    </span>
  );
}
