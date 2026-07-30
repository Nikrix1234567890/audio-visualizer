// Single source of truth for the visualizer's configurable settings.
// Shared between the Remotion composition, the live editor UI and the
// server-side render API route, so all three always agree on the schema.

export type VisualizerSettings = {
  /** Must be a power of two (16, 32, 64, 128, ...) - required by visualizeAudio(). */
  barCount: number;
  radius: number;
  barWidth: number;
  heightScale: number;
  hueStart: number;
  hueEnd: number;
  cameraSpeed: number;
};

export const DEFAULT_VISUALIZER_SETTINGS: VisualizerSettings = {
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
