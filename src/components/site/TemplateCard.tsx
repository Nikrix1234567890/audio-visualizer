"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import type { TemplateSummary } from "./templateData";

/**
 * A template: its picture, which starts playing its silent loop while the
 * card is hovered or focused (the loop is only downloaded then), its name
 * and how many elements it is made of. Lifts on a spring.
 */
export function TemplateCard({
  template,
  href,
  meta,
}: {
  template: Pick<TemplateSummary, "id" | "label" | "elements">;
  href: string;
  /** Replaces "n elements" under the name. */
  meta?: string;
}) {
  const [isActive, setIsActive] = useState(false);

  return (
    <motion.div
      className="tc"
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <Link
        href={href}
        className="pf-tcard"
        onPointerEnter={() => setIsActive(true)}
        onPointerLeave={() => setIsActive(false)}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
      >
        <span className="pf-tcard__media media-box">
          {/* A small static file from the public folder of this app: the image
              optimiser would add a request round trip and gain nothing. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="media"
            src={`/thumbnails/templates/${template.id}.jpg`}
            alt=""
            loading="lazy"
            width={480}
            height={270}
          />
          {isActive && (
            <motion.video
              src={`/previews/${template.id}.mp4`}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            />
          )}
        </span>
        <span className="pf-tcard__body">
          <span className="pf-tcard__name">{template.label}</span>
          <span className="pf-tcard__meta">
            {meta ?? `${template.elements} ${template.elements === 1 ? "element" : "elements"}`}
          </span>
        </span>
      </Link>
    </motion.div>
  );
}
