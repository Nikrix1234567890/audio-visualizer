import React, {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {PerspectiveCamera} from 'three';
import {EffectComposer, Bloom, Vignette} from '@react-three/postprocessing';
import {BlendFunction} from 'postprocessing';
import {getAudioFrame, type TrackAnalysis} from '../audio/analysis';
import {resolveParams, resolveTransform} from './bindings';
import {cameraPosition} from './camera';
import {
  CAMERA_PARAMS,
  ELEMENT_DEFS,
  LOOK_PARAMS,
  type CameraSettings,
  type SceneDocument,
} from './definitions';
import {BASE_ELEMENT_COMPONENTS, type ElementProps} from './elements';
import {EXTRA_ELEMENT_COMPONENTS} from './elementsExtra';
import type {ElementType} from './definitions';

const ELEMENT_COMPONENTS: Record<ElementType, React.FC<ElementProps>> = {
  ...BASE_ELEMENT_COMPONENTS,
  ...EXTRA_ELEMENT_COMPONENTS,
};

const DEG_TO_RAD = Math.PI / 180;

/**
 * Puts the canvas camera where the scene wants it for this point in time.
 *
 * React Three Fiber only reads the canvas `camera` prop once, when the
 * canvas is created, so later changes have to be applied to the camera
 * object directly. A layout effect runs before Remotion draws the frame
 * (its frame renderer uses a passive effect), so the picture never shows a
 * camera that belongs to a different frame or scene.
 */
const CameraRig: React.FC<{
  settings: CameraSettings;
  time: number;
  bass: number;
}> = ({settings, time, bass}) => {
  // Read the camera through the store getter: it is a three.js object we
  // are meant to move, not a React value.
  const getState = useThree((state) => state.get);

  useLayoutEffect(() => {
    const {camera, invalidate} = getState();
    const [x, y, z] = cameraPosition(settings, time, bass);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    if (camera instanceof PerspectiveCamera && camera.fov !== settings.fov) {
      camera.fov = settings.fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    invalidate();
  }, [getState, settings, time, bass]);

  return null;
};

/**
 * Draws a scene document inside a three.js canvas: the camera, fog, lights,
 * every visible element at its transform, then the post-processing pass.
 */
export const SceneRenderer: React.FC<{
  scene: SceneDocument;
  analysis: TrackAnalysis;
  time: number;
  assetUrl: (key: string) => string;
}> = ({scene, analysis, time, assetUrl}) => {
  const audio = getAudioFrame(analysis, time);
  // Everything below uses the values for this moment: the user's settings
  // plus whatever their audio bindings add right now.
  const look = resolveParams(LOOK_PARAMS, scene.look, scene.lookBindings, audio);
  const camera = resolveParams(
    CAMERA_PARAMS,
    scene.camera,
    scene.cameraBindings,
    audio,
  );

  return (
    <>
      <CameraRig settings={camera} time={time} bass={audio.bass} />
      {look.fog ? (
        <fog attach="fog" args={[look.background, look.fogNear, look.fogFar]} />
      ) : null}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />

      {scene.elements.map((element) => {
        if (!element.visible) return null;
        const Component = ELEMENT_COMPONENTS[element.type];
        const {position, rotation, scale} = resolveTransform(element, audio);
        const [rx, ry, rz] = rotation;

        return (
          <group
            key={element.id}
            position={position}
            rotation={[rx * DEG_TO_RAD, ry * DEG_TO_RAD, rz * DEG_TO_RAD]}
            scale={scale}
          >
            <Component
              params={resolveParams(
                ELEMENT_DEFS[element.type].params,
                element.params,
                element.bindings,
                audio,
              )}
              analysis={analysis}
              audio={audio}
              time={time}
              assetUrl={assetUrl}
            />
          </group>
        );
      })}

      <EffectComposer>
        <Bloom
          mipmapBlur
          luminanceThreshold={0.15}
          luminanceSmoothing={0.3}
          intensity={look.bloom}
          radius={0.85}
        />
        <Vignette
          eskil={false}
          offset={0.15}
          darkness={look.vignette}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  );
};
