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
  /** Selection and gizmo hooks. Only the editor passes these, never a render. */
  editor?: SceneEditorHooks;
};
