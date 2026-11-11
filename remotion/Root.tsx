import React from 'react';
import {Composition, staticFile} from 'remotion';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {HelloWorld} from './compositions/HelloWorld';
import {Demo3D} from './compositions/Demo3D';
import {AudioVisualizer3D} from './compositions/AudioVisualizer3D';
import {DEFAULT_TEMPLATE} from './scene/templates';

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={90}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="Demo3D"
        component={Demo3D}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="AudioVisualizer3D"
        component={AudioVisualizer3D}
        fps={FPS}
        width={1280}
        height={720}
        // Placeholder, overridden by calculateMetadata below based on the
        // real audio file duration - required as a fallback before that
        // resolves (e.g. for the Studio's composition list).
        durationInFrames={12 * FPS}
        defaultProps={{
          audioSrc: staticFile('audio/demo-track.wav'),
          scene: DEFAULT_TEMPLATE.scene,
          appBase: '',
        }}
        calculateMetadata={async ({props}) => {
          const durationInSeconds = await getAudioDurationInSeconds(
            props.audioSrc,
          );
          return {
            durationInFrames: Math.max(
              1,
              Math.floor(durationInSeconds * FPS),
            ),
          };
        }}
      />
    </>
  );
};
