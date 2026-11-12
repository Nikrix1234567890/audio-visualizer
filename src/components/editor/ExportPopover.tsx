"use client";

import { Crown, Download, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ASPECTS,
  FRAME_RATES,
  RESOLUTIONS,
  outputSize,
  type AspectKey,
  type FrameRate,
  type ResolutionKey,
} from "../../../remotion/types";
import { ExportLength } from "@/components/editor/ExportLength";
import { SegmentedSelector } from "@/components/ui/SegmentedSelector";
import {
  TIER_LIMITS,
  isFrameRateAllowed,
  isResolutionAllowed,
  type TierName,
} from "@/lib/tiers";
import type { ExportRange } from "@/lib/visualizerSettings";

export type RenderState = {
  canRender: boolean;
  isUploading: boolean;
  isRendering: boolean;
  progress: number;
  /** Renders still ahead in the queue, or null once ours has started. */
  ahead: number | null;
  error: string | null;
  renderedUrl: string | null;
};

/**
 * Opens from Export in the app bar: format, resolution, frame rate and
 * length, then the one button. Options the plan does not include stay
 * readable and carry a gold lock.
 */
export function ExportPopover({
  aspect,
  onAspectChange,
  resolution,
  onResolutionChange,
  frameRate,
  onFrameRateChange,
  tier,
  exportRange,
  onExportRangeChange,
  trackSeconds,
  render,
  onRender,
  onClose,
}: {
  aspect: AspectKey;
  onAspectChange: (value: AspectKey) => void;
  resolution: ResolutionKey;
  onResolutionChange: (value: ResolutionKey) => void;
  frameRate: FrameRate;
  onFrameRateChange: (value: FrameRate) => void;
  /** The visitor's plan: decides which options are locked. */
  tier: TierName;
  /** The section of the track to export, or null for all of it. */
  exportRange: ExportRange | null;
  onExportRangeChange: (range: ExportRange | null) => void;
  /** Length of the loaded track in seconds; 0 without one. */
  trackSeconds: number;
  render: RenderState;
  onRender: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Set when a locked option was clicked: the Premium note lights up.
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (ref.current?.contains(target)) return;
      // The Export button toggles the popover itself.
      if (target?.closest("[data-export-toggle]")) return;
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onClose]);

  const size = outputSize(aspect, resolution);
  const seconds = exportRange ? exportRange.end - exportRange.start : trackSeconds;
  const length = `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
  const isBusy = render.isUploading || render.isRendering;
  const percent = Math.round(render.progress * 100);

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label="Export video"
      className="pf-popover pf-stack ed__pop gap-3"
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 520, damping: 36 }}
      style={{ transformOrigin: "top right" }}
    >
      <div className="text-[17px] leading-6 font-semibold tracking-[-0.01em]">Export video</div>

      <div className="pf-field">
        <span className="pf-label">Format</span>
        <SegmentedSelector
          stretch
          label="Format"
          options={Object.entries(ASPECTS).map(([key, a]) => ({
            value: key as AspectKey,
            label: a.label,
          }))}
          value={aspect}
          onChange={onAspectChange}
        />
      </div>

      <div className="pf-field">
        <span className="pf-label">Resolution</span>
        <SegmentedSelector
          stretch
          label="Resolution"
          options={Object.entries(RESOLUTIONS).map(([key, r]) => ({
            value: key as ResolutionKey,
            label: r.label,
            locked: !isResolutionAllowed(tier, key as ResolutionKey),
          }))}
          value={resolution}
          onChange={onResolutionChange}
          onLocked={() => setShowUpgrade(true)}
        />
      </div>

      <div className="pf-field">
        <span className="pf-label">Frame rate</span>
        <SegmentedSelector
          stretch
          label="Frame rate"
          options={FRAME_RATES.map((fps) => ({
            value: fps,
            label: `${fps} fps`,
            locked: !isFrameRateAllowed(tier, fps),
          }))}
          value={frameRate}
          onChange={onFrameRateChange}
          onLocked={() => setShowUpgrade(true)}
        />
      </div>

      <div className="pf-field">
        <span className="pf-label">Length</span>
        <ExportLength range={exportRange} duration={trackSeconds} onChange={onExportRangeChange} />
      </div>

      {tier === "FREE" ? (
        <motion.div
          className="pf-banner pf-banner--premium"
          animate={showUpgrade ? { scale: [1, 1.03, 1] } : undefined}
          transition={{ duration: 0.3 }}
        >
          <Crown className="pf-i" aria-hidden />
          <span>
            <b>
              Free: up to {TIER_LIMITS.FREE.maxResolution} at{" "}
              {TIER_LIMITS.FREE.frameRates.join(" / ")} fps, with a small watermark.
            </b>{" "}
            Premium goes up to 4K at 60 fps, without it.{" "}
            <Link href="/pricing" className="text-premium underline underline-offset-2">
              See Premium
            </Link>
          </span>
        </motion.div>
      ) : (
        <p className="pf-note">60 fps is as smooth as the preview; 30 fps renders in half the time.</p>
      )}

      {render.error && (
        <div className="pf-banner pf-banner--danger" role="alert">
          <TriangleAlert className="pf-i" aria-hidden />
          <span>
            <b>The export stopped.</b> {render.error}
          </span>
        </div>
      )}

      {render.isRendering && (
        <div className="pf-stack gap-1.5" role="status">
          <div className="pf-progress" style={{ "--p": render.progress } as React.CSSProperties}>
            <span />
          </div>
          <span className="pf-job__meta">
            {render.ahead !== null
              ? render.ahead > 0
                ? `Waiting, ${render.ahead} ahead in the queue`
                : "Starting"
              : `Rendering ${percent}%`}
          </span>
        </div>
      )}

      {render.renderedUrl && !isBusy && (
        <a href={render.renderedUrl} download className="pf-btn pf-btn--accent pf-btn--block">
          <Download className="pf-i" aria-hidden />
          Download video
        </a>
      )}

      <div className="pf-row justify-between">
        <span className="pf-note font-mono tabular-nums">
          {size.width} x {size.height}
          {render.canRender ? ` · ${length}` : ""}
        </span>
        <button
          type="button"
          className="pf-btn pf-btn--cta"
          disabled={!render.canRender || isBusy}
          aria-busy={isBusy}
          onClick={onRender}
        >
          <Download className="pf-i" aria-hidden />
          {render.renderedUrl ? "Export again" : "Export"}
        </button>
      </div>
      {!render.canRender && <p className="pf-note">Load a track to export.</p>}
    </motion.div>
  );
}
