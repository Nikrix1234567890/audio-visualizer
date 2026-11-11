import {
  DEFAULT_RESOLUTION,
  RESOLUTIONS,
  type ResolutionKey,
} from "../../remotion/types";

const ALLOWED_RESOLUTIONS = Object.keys(RESOLUTIONS) as ResolutionKey[];

/** Never trust client input directly - only known resolutions are allowed. */
export function sanitizeResolution(input: unknown): ResolutionKey {
  return ALLOWED_RESOLUTIONS.includes(input as ResolutionKey)
    ? (input as ResolutionKey)
    : DEFAULT_RESOLUTION;
}
