import {
  ASPECTS,
  DEFAULT_ASPECT,
  DEFAULT_FRAME_RATE,
  DEFAULT_RESOLUTION,
  FRAME_RATES,
  RESOLUTIONS,
  type AspectKey,
  type FrameRate,
  type ResolutionKey,
} from "../../remotion/types";

const ALLOWED_RESOLUTIONS = Object.keys(RESOLUTIONS) as ResolutionKey[];

/** Never trust client input directly - only known resolutions are allowed. */
export function sanitizeResolution(input: unknown): ResolutionKey {
  return ALLOWED_RESOLUTIONS.includes(input as ResolutionKey)
    ? (input as ResolutionKey)
    : DEFAULT_RESOLUTION;
}

/** Only the offered picture formats are allowed. */
export function sanitizeAspect(input: unknown): AspectKey {
  return typeof input === "string" && Object.keys(ASPECTS).includes(input)
    ? (input as AspectKey)
    : DEFAULT_ASPECT;
}

/** Only the offered frame rates are allowed. */
export function sanitizeFrameRate(input: unknown): FrameRate {
  return FRAME_RATES.includes(input as FrameRate)
    ? (input as FrameRate)
    : DEFAULT_FRAME_RATE;
}

/** A part of the track to export, in seconds from its start. */
export type ExportRange = { start: number; end: number };

/** The shortest section that can be exported, in seconds. */
export const MIN_RANGE_SECONDS = 1;

/**
 * The section of the track to export, or null for the whole track. Anything
 * that is not a proper section (missing, not numbers, too short) means the
 * whole track. The end is cut to the track's real length when rendering,
 * which is only known then (see frameRangeFor).
 */
export function sanitizeRange(input: unknown): ExportRange | null {
  if (typeof input !== "object" || input === null) return null;
  const { start, end } = input as Record<string, unknown>;
  if (typeof start !== "number" || typeof end !== "number") return null;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const from = Math.max(0, start);
  if (end - from < MIN_RANGE_SECONDS) return null;
  return { start: from, end };
}

/**
 * First and last frame (inclusive) of a section in a video of `totalFrames`
 * frames, or null if the section starts after the track has ended.
 */
export function frameRangeFor(
  range: ExportRange,
  fps: number,
  totalFrames: number,
): [number, number] | null {
  const first = Math.round(range.start * fps);
  if (first >= totalFrames) return null;
  const last = Math.min(totalFrames, Math.round(range.end * fps)) - 1;
  return [first, Math.max(first, last)];
}
