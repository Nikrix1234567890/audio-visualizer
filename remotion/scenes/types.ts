import type {MediaUtilsAudioData} from '@remotion/media-utils';
import type {VisualizerSettings} from '../types';

export type SceneProps = {
  audioData: MediaUtilsAudioData;
  frame: number;
  fps: number;
  settings: VisualizerSettings;
};
