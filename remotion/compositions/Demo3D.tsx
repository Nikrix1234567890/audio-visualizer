import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';

const BAR_COUNT = 32;

/**
 * Radial bar field. Bar heights are driven by a deterministic pseudo-signal
 * for now (proof that ThreeCanvas + react-three-fiber render correctly
 * both in Studio and in a headless server-side render). In Phase 1 this
 * will be replaced by real audio spectrum data from @remotion/media-utils.
 */
const Bars: React.FC<{time: number}> = ({time}) => {
  const bars = useMemo(() => new Array(BAR_COUNT).fill(0).map((_, i) => i), []);

  return (
    <>
      {bars.map((i) => {
        const angle = (i / BAR_COUNT) * Math.PI * 2;
        const radius = 4;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        const height =
          0.5 +
          Math.abs(Math.sin(time * 2 + i * 0.4)) * 2.5 +
          Math.abs(Math.sin(time * 5.3 + i)) * 0.5;

        return (
          <mesh key={i} position={[x, height / 2 - 1.5, z]}>
            <boxGeometry args={[0.3, height, 0.3]} />
            <meshStandardMaterial
              color={`hsl(${(i / BAR_COUNT) * 360}, 80%, 60%)`}
            />
          </mesh>
        );
      })}
    </>
  );
};

export const Demo3D: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const time = frame / fps;

  const cameraAngle = time * 0.3;
  const cameraX = Math.sin(cameraAngle) * 9;
  const cameraZ = Math.cos(cameraAngle) * 9;

  return (
    <AbsoluteFill style={{backgroundColor: '#05070d'}}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{position: [cameraX, 4, cameraZ], fov: 50}}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <Bars time={time} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
