import React from 'react';
import {Composition} from 'remotion';
import {HelloWorld} from './compositions/HelloWorld';
import {Demo3D} from './compositions/Demo3D';

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
    </>
  );
};
