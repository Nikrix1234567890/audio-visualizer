/**
 * A 16:9 preview picture from public/thumbnails (made by `pnpm thumbnails`).
 * `dimmed` pictures light up when their card is hovered or focused - the
 * lit/unlit rule of the rest of the panel.
 */
export function Thumbnail({ src, dimmed = false }: { src: string; dimmed?: boolean }) {
  return (
    // A small static file from this app's own public folder: the image
    // optimiser would add a request round trip and gain nothing.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      width={480}
      height={270}
      className={`aspect-video w-full bg-canvas object-cover transition-opacity ${
        dimmed ? "opacity-70 group-hover:opacity-100 group-focus-visible:opacity-100" : ""
      }`}
    />
  );
}
