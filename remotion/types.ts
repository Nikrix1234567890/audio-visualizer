// Single source of truth for the visualizer's configurable settings.
// Shared between the Remotion compositions, the live editor UI and the
// server-side render API route, so all three always agree on the schema.

export type SceneId = "radialBars" | "sphereSwarm" | "terrainWave";

export const SCENES: { id: SceneId; label: string }[] = [
  { id: "radialBars", label: "Radial Bars" },
  { id: "sphereSwarm", label: "Sphere Swarm" },
  { id: "terrainWave", label: "Terrain Wave" },
];

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

export type VisualizerSettings = {
  scene: SceneId;
  /** Must be a power of two (16, 32, 64, 128, ...) - required by visualizeAudio(). */
  barCount: number;
  /** Overall scale of the scene (ring radius / sphere radius / grid size, depending on the active scene). */
  radius: number;
  barWidth: number;
  heightScale: number;
  hueStart: number;
  hueEnd: number;
  cameraSpeed: number;
};

export const DEFAULT_VISUALIZER_SETTINGS: VisualizerSettings = {
  scene: "radialBars",
  barCount: 64,
  radius: 4,
  barWidth: 0.3,
  heightScale: 4.5,
  hueStart: 200,
  hueEnd: 500,
  cameraSpeed: 0.25,
};

export type AudioVisualizerProps = VisualizerSettings & {
  audioSrc: string;
};
