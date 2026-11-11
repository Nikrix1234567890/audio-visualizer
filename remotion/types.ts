// Shared between the Remotion composition, the live editor UI and the
// server-side render API route, so all three always agree on the schema.
// The scene document itself is defined in ./scene/definitions.ts.

import type { SceneDocument } from "./scene/definitions";

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

export type AudioVisualizerProps = {
  audioSrc: string;
  scene: SceneDocument;
  /**
   * Prefix that turns the storage key of an uploaded file (e.g. a picture
   * used by an Image element) into a loadable URL: "/api/files/" in the
   * editor, the app's full address during a server render.
   */
  assetBase: string;
};
