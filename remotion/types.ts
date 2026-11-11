// Shared between the Remotion composition, the live editor UI and the
// server-side render API route, so all three always agree on the schema.
// The scene document itself is defined in ./scene/definitions.ts.

import type { SceneDocument } from "./scene/definitions";
import type { SceneEditorHooks } from "./scene/SceneRenderer";

export type ResolutionKey = "720p" | "1080p" | "1440p" | "4k";

export const RESOLUTIONS: Record<
  ResolutionKey,
  { width: number; height: number; label: string }
> = {
  "720p": { width: 1280, height: 720, label: "720p" },
  "1080p": { width: 1920, height: 1080, label: "1080p" },
  "1440p": { width: 2560, height: 1440, label: "1440p" },
  "4k": { width: 3840, height: 2160, label: "4K" },
};

export const DEFAULT_RESOLUTION: ResolutionKey = "1080p";

/** Picture formats: landscape, portrait (phone feeds) and square. */
export type AspectKey = "16:9" | "9:16" | "1:1";

export const ASPECTS: Record<AspectKey, { label: string; ratio: number }> = {
  "16:9": { label: "16:9", ratio: 16 / 9 },
  "9:16": { label: "9:16", ratio: 9 / 16 },
  "1:1": { label: "1:1", ratio: 1 },
};

export const DEFAULT_ASPECT: AspectKey = "16:9";

/**
 * Pixel size of a video. The resolution names the short side ("1080p" is
 * 1920x1080 in landscape, 1080x1920 in portrait and 1080x1080 as a square).
 */
export function outputSize(
  aspect: AspectKey,
  resolution: ResolutionKey,
): { width: number; height: number } {
  const { width: long, height: short } = RESOLUTIONS[resolution];
  if (aspect === "9:16") return { width: short, height: long };
  if (aspect === "1:1") return { width: short, height: short };
  return { width: long, height: short };
}

/** Frame rates a video can be exported in. */
export const FRAME_RATES = [30, 60] as const;
export type FrameRate = (typeof FRAME_RATES)[number];
/** 60 matches the editor preview; 30 renders in half the time. */
export const DEFAULT_FRAME_RATE: FrameRate = 60;

export type AudioVisualizerProps = {
  audioSrc: string;
  scene: SceneDocument;
  /**
   * Where the app itself is reachable, without a trailing slash. Uploaded
   * files (pictures, models) and the text font are loaded from there. Empty
   * in the editor, where relative addresses work; the app's full address
   * during a server render, which runs on a different port.
   */
  appBase: string;
  /**
   * Only set during a server render started by a logged-in user: lets the
   * render browser, which has no login cookie, read that account's
   * uploaded pictures and models. See src/lib/fileAccess.ts.
   */
  fileToken?: string;
  /**
   * Draws the app's mark in a corner - the free plan. Decided by the server
   * for a render and by the editor for the preview, so both look the same.
   */
  watermark?: boolean;
  /** Selection and gizmo hooks. Only the editor passes these, never a render. */
  editor?: SceneEditorHooks;
};
