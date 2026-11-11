import {
  FRAME_RATES,
  RESOLUTIONS,
  type FrameRate,
  type ResolutionKey,
} from "../../remotion/types";

// What each plan may export. Pure data, shared by the editor (to show what
// is locked) and the render route (which enforces it - the editor's word
// is never trusted).

export type TierName = "FREE" | "PREMIUM";

type TierLimits = {
  /** Largest export resolution. */
  maxResolution: ResolutionKey;
  frameRates: readonly FrameRate[];
  /** Whether the video carries the app's mark in a corner. */
  watermark: boolean;
};

export const TIER_LIMITS: Record<TierName, TierLimits> = {
  FREE: { maxResolution: "720p", frameRates: [30], watermark: true },
  PREMIUM: { maxResolution: "4k", frameRates: FRAME_RATES, watermark: false },
};

const RESOLUTION_ORDER = Object.keys(RESOLUTIONS) as ResolutionKey[];

export function isResolutionAllowed(tier: TierName, resolution: ResolutionKey) {
  return (
    RESOLUTION_ORDER.indexOf(resolution) <=
    RESOLUTION_ORDER.indexOf(TIER_LIMITS[tier].maxResolution)
  );
}

export function isFrameRateAllowed(tier: TierName, fps: FrameRate) {
  return TIER_LIMITS[tier].frameRates.includes(fps);
}

/** The chosen settings, lowered to what the plan allows. */
export function clampToTier(
  tier: TierName,
  resolution: ResolutionKey,
  fps: FrameRate,
): { resolution: ResolutionKey; fps: FrameRate } {
  const limits = TIER_LIMITS[tier];
  return {
    resolution: isResolutionAllowed(tier, resolution)
      ? resolution
      : limits.maxResolution,
    fps: isFrameRateAllowed(tier, fps)
      ? fps
      : limits.frameRates[limits.frameRates.length - 1],
  };
}
