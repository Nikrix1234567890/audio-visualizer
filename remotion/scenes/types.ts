import type {TrackAnalysis} from '../audio/analysis';
import type {VisualizerSettings} from '../types';

export type SceneProps = {
  /** Pre-computed analysis of the whole track, see remotion/audio/analysis.ts. */
  analysis: TrackAnalysis;
  frame: number;
  fps: number;
  settings: VisualizerSettings;
};
