import {
  DEFAULT_FRAME_RATE,
  DEFAULT_RESOLUTION,
  FRAME_RATES,
  RESOLUTIONS,
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

/** Only the offered frame rates are allowed. */
export function sanitizeFrameRate(input: unknown): FrameRate {
  return FRAME_RATES.includes(input as FrameRate)
    ? (input as FrameRate)
    : DEFAULT_FRAME_RATE;
}
