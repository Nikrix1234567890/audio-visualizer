"use client";

import { useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Marquee } from "./kit";

/** One loop in the row. It only plays while it is on screen. */
function LoopCard({ id, label }: { id: string; label: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(ref, { margin: "0px 80px" });
  const isReduced = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isInView && !isReduced) video.play().catch(() => {});
    else video.pause();
  }, [isInView, isReduced]);

  return (
    <Link ref={ref} href={`/templates/${id}`} className="mq__card media-box">
      <video
        ref={videoRef}
        src={`/previews/${id}.mp4`}
        poster={`/thumbnails/templates/${id}.jpg`}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
      />
      <span className="mq__name">{label}</span>
    </Link>
  );
}

/** An endless row of template loops, each a link to its page. */
export function TemplateMarquee({
  templates,
  reverse = false,
  seconds = 60,
}: {
  templates: { id: string; label: string }[];
  reverse?: boolean;
  seconds?: number;
}) {
  return (
    <Marquee seconds={seconds} reverse={reverse}>
      {templates.map((template) => (
        <LoopCard key={template.id} id={template.id} label={template.label} />
      ))}
    </Marquee>
  );
}
