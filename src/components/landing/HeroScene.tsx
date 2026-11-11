"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { TEMPLATES } from "../../../remotion/scene/templates";

// The 3D engine is large; it loads after the page is up, and only in the
// browser. Until then the recorded loop below is shown.
const HeroPlayer = dynamic(() => import("./HeroPlayer"), { ssr: false });

/** Templates the visitor can flip through in the hero. */
const CHOICES = ["galaxy", "pulseRing", "vortex", "helix", "radialBars"];
/** How far the frame leans towards the pointer, in degrees. */
const MAX_TILT = 7;

/**
 * The picture in the hero: a live, playing 3D scene in a frame that leans
 * towards the pointer, with a row of templates to switch between.
 */
export function HeroScene() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [templateId, setTemplateId] = useState(CHOICES[0]);

  const lean = (e: React.PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    if (!frame || e.pointerType === "touch") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    frame.style.transform = `rotateY(${x * MAX_TILT * 2}deg) rotateX(${-y * MAX_TILT * 2}deg)`;
  };
  const settle = () => {
    if (frameRef.current) frameRef.current.style.transform = "";
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className="[perspective:1200px]"
        onPointerMove={lean}
        onPointerLeave={settle}
      >
        <div
          ref={frameRef}
          className="relative rounded-2xl border border-line bg-surface p-2 shadow-[0_30px_80px_-20px_rgba(139,92,246,0.55)] transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none"
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-canvas">
            {/* Shown at once, and stays if the live scene cannot start. */}
            <video
              key={templateId}
              className="absolute inset-0 h-full w-full object-cover"
              src={`/previews/${templateId}.mp4`}
              poster={`/thumbnails/templates/${templateId}.jpg`}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden
            />
            <div className="absolute inset-0">
              <HeroPlayer templateId={templateId} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
          Live
        </span>
        {CHOICES.map((id) => {
          const template = TEMPLATES.find((t) => t.id === id);
          if (!template) return null;
          const isActive = id === templateId;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setTemplateId(id)}
              className={`rounded-full border px-3 py-1 font-mono text-[11px] tracking-[0.06em] uppercase outline-none transition-colors focus-visible:border-accent ${
                isActive
                  ? "border-accent-dim bg-surface-raised text-accent shadow-glow-active"
                  : "border-line text-muted hover:text-ink"
              }`}
            >
              {template.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
