import {
  DEFAULT_RESOLUTION,
  DEFAULT_VISUALIZER_SETTINGS,
  RESOLUTIONS,
  SCENES,
  type ResolutionKey,
  type SceneId,
  type VisualizerSettings,
} from "../../remotion/types";

export const ALLOWED_BAR_COUNTS = [16, 32, 64, 128];
const ALLOWED_SCENES = SCENES.map((s) => s.id);
const ALLOWED_RESOLUTIONS = Object.keys(RESOLUTIONS) as ResolutionKey[];

export function sanitizeResolution(input: unknown): ResolutionKey {
  return ALLOWED_RESOLUTIONS.includes(input as ResolutionKey)
    ? (input as ResolutionKey)
    : DEFAULT_RESOLUTION;
}

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const n =
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, n));
}

/** Never trust client input directly - clamp/allowlist everything server-side. */
export function sanitizeSettings(input: unknown): VisualizerSettings {
  const raw = (input ?? {}) as Partial<VisualizerSettings>;
  const barCount = ALLOWED_BAR_COUNTS.includes(raw.barCount as number)
    ? (raw.barCount as number)
    : DEFAULT_VISUALIZER_SETTINGS.barCount;
  const scene = ALLOWED_SCENES.includes(raw.scene as SceneId)
    ? (raw.scene as SceneId)
    : DEFAULT_VISUALIZER_SETTINGS.scene;

  return {
    scene,
    barCount,
    radius: clampNumber(raw.radius, DEFAULT_VISUALIZER_SETTINGS.radius, 1, 10),
    barWidth: clampNumber(
      raw.barWidth,
      DEFAULT_VISUALIZER_SETTINGS.barWidth,
      0.05,
      1,
    ),
    heightScale: clampNumber(
      raw.heightScale,
      DEFAULT_VISUALIZER_SETTINGS.heightScale,
      1,
      10,
    ),
    hueStart: clampNumber(
      raw.hueStart,
      DEFAULT_VISUALIZER_SETTINGS.hueStart,
      0,
      360,
    ),
    hueEnd: clampNumber(raw.hueEnd, DEFAULT_VISUALIZER_SETTINGS.hueEnd, 0, 720),
    cameraSpeed: clampNumber(
      raw.cameraSpeed,
      DEFAULT_VISUALIZER_SETTINGS.cameraSpeed,
      0,
      2,
    ),
  };
}
