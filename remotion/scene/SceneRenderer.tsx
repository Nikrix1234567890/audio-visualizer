import React, {useLayoutEffect, useState} from 'react';
import {TransformControls} from '@react-three/drei';
import {useThree} from '@react-three/fiber';
import {PerspectiveCamera, type Group} from 'three';
import {EffectComposer, Bloom, Vignette} from '@react-three/postprocessing';
import {BlendFunction} from 'postprocessing';
import {getAudioFrame, type TrackAnalysis} from '../audio/analysis';
import {baseTransform, resolveParams, resolveTransform} from './bindings';
import {warpTime} from './keyframes';
import {cameraPosition, verticalFov} from './camera';
import {
  CAMERA_PARAMS,
  ELEMENT_DEFS,
  LOOK_PARAMS,
  TRANSFORM_LIMITS,
  type CameraSettings,
  type ElementType,
  type SceneDocument,
  type SceneElement,
  type Vec3,
} from './definitions';
import {BASE_ELEMENT_COMPONENTS, type ElementProps} from './elements';
import {ASSET_ELEMENT_COMPONENTS} from './elementsAssets';
import {DENSE_ELEMENT_COMPONENTS} from './elementsDense';
import {EXTRA_ELEMENT_COMPONENTS} from './elementsExtra';
import {MORE_ELEMENT_COMPONENTS} from './elementsMore';
import {SHAPE_ELEMENT_COMPONENTS} from './elementsShapes';

const ELEMENT_COMPONENTS: Record<ElementType, React.FC<ElementProps>> = {
  ...BASE_ELEMENT_COMPONENTS,
  ...EXTRA_ELEMENT_COMPONENTS,
  ...ASSET_ELEMENT_COMPONENTS,
  ...DENSE_ELEMENT_COMPONENTS,
  ...SHAPE_ELEMENT_COMPONENTS,
  ...MORE_ELEMENT_COMPONENTS,
};

const DEG_TO_RAD = Math.PI / 180;

export type TransformTool = 'off' | 'move' | 'rotate' | 'scale';

/**
 * What the editor hooks into the picture: which element is selected, which
 * tool is active, and callbacks for clicking an element and for dragging
 * the gizmo. Never passed during a render - a rendered video contains the
 * scene only.
 */
export type SceneEditorHooks = {
  selectedId: string | null;
  tool: TransformTool;
  onSelect: (id: string) => void;
  onTransform: (
    id: string,
    patch: Partial<Pick<SceneElement, 'position' | 'rotation' | 'scale'>>,
  ) => void;
};

/**
 * Elements that can be selected by clicking them in the picture. Things
 * that fill the whole view (backdrop, stars, grid, particles) are left out,
 * or every click would land on them.
 */
const CLICKABLE = new Set<ElementType>([
  'barRing',
  'sphereSwarm',
  'terrainLines',
  'core',
  'glowDisc',
  'sun',
  'spectrumRing',
  'image',
  'model',
  'text',
  'waveSurface',
  'particleDisc',
  'helix',
  'galaxy',
  'spikeOrb',
  'rippleRings',
  'resonancePlate',
  'pendulumWave',
  'hypercube',
  'ledWall',
  'radar',
  'corona',
  'sunflower',
  'torusKnot',
  'jellyfish',
]);

const GIZMO_MODE = {move: 'translate', rotate: 'rotate', scale: 'scale'} as const;

const round = (value: number) => Math.round(value * 100) / 100;
const clamp = (value: number, limits: {min: number; max: number}) =>
  Math.min(limits.max, Math.max(limits.min, value));
/** Brings an angle in degrees back into -180..180. */
const wrapDegrees = (value: number) => ((((value + 180) % 360) + 360) % 360) - 180;

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
  const aspect = useThree((state) => state.size.width / state.size.height);

  useLayoutEffect(() => {
    const {camera, invalidate} = getState();
    const [x, y, z] = cameraPosition(settings, time, bass);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    const fov = verticalFov(settings.fov, aspect);
    if (camera instanceof PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    invalidate();
  }, [getState, settings, time, bass, aspect]);

  return null;
};

/**
 * Draws a scene document inside a three.js canvas: the camera, fog, lights,
 * every visible element at its transform, then the post-processing pass.
 * With `editor` hooks it also makes elements clickable and shows the
 * move / rotate / scale gizmo on the selected one.
 */
export const SceneRenderer: React.FC<{
  scene: SceneDocument;
  analysis: TrackAnalysis;
  time: number;
  assetUrl: (key: string) => string;
  fontBase: string;
  editor?: SceneEditorHooks;
}> = ({scene, analysis, time, assetUrl, fontBase, editor}) => {
  const audio = getAudioFrame(analysis, time);
  // Everything below uses the values for this moment: the user's settings
  // plus whatever their audio bindings add right now.
  const look = resolveParams(
    LOOK_PARAMS,
    scene.look,
    scene.lookBindings,
    audio,
    scene.lookKeyframes,
    time,
  );
  const camera = resolveParams(
    CAMERA_PARAMS,
    scene.camera,
    scene.cameraBindings,
    audio,
    scene.cameraKeyframes,
    time,
  );

  // The three.js group of the selected element, for the gizmo to hold on to.
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const selected = editor
    ? scene.elements.find((e) => e.id === editor.selectedId && e.visible)
    : undefined;

  /** The gizmo moved the group: work out what that means for the element's own values. */
  const applyGizmo = () => {
    if (!editor || !selected || !selectedGroup) return;
    // What is on screen is "own value + audio binding". The drag changes
    // what is on screen, so the difference goes onto the own value - which
    // is the keyframed value of this moment, if the transform is keyframed
    // (the editor then moves or adds a keyframe here).
    const shown = resolveTransform(selected, audio, time);
    const own = baseTransform(selected, time);

    if (editor.tool === 'move') {
      const moved = selectedGroup.position.toArray();
      editor.onTransform(selected.id, {
        position: own.position.map((value, i) =>
          round(clamp(value + moved[i] - shown.position[i], TRANSFORM_LIMITS.position)),
        ) as Vec3,
      });
    } else if (editor.tool === 'rotate') {
      const {x, y, z} = selectedGroup.rotation;
      const turned = [x, y, z].map((radians) => radians / DEG_TO_RAD);
      editor.onTransform(selected.id, {
        rotation: own.rotation.map((value, i) =>
          Math.round(wrapDegrees(value + turned[i] - shown.rotation[i])),
        ) as Vec3,
      });
    } else if (editor.tool === 'scale') {
      // Elements scale evenly, so follow whichever axis was dragged furthest.
      const scaled = selectedGroup.scale
        .toArray()
        .reduce((a, b) => (Math.abs(b - shown.scale) > Math.abs(a - shown.scale) ? b : a));
      editor.onTransform(selected.id, {
        scale: round(clamp(own.scale + scaled - shown.scale, TRANSFORM_LIMITS.scale)),
      });
    }
  };

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
        const {position, rotation, scale} = resolveTransform(element, audio, time);
        const [rx, ry, rz] = rotation;
        const isSelected = Boolean(editor && element.id === editor.selectedId);

        return (
          <group
            key={element.id}
            ref={isSelected ? setSelectedGroup : undefined}
            position={position}
            rotation={[rx * DEG_TO_RAD, ry * DEG_TO_RAD, rz * DEG_TO_RAD]}
            scale={scale}
            onClick={
              editor && CLICKABLE.has(element.type)
                ? (event) => {
                    event.stopPropagation();
                    editor.onSelect(element.id);
                  }
                : undefined
            }
          >
            <Component
              params={resolveParams(
                ELEMENT_DEFS[element.type].params,
                element.params,
                element.bindings,
                audio,
                element.keyframes,
                time,
              )}
              analysis={analysis}
              audio={audio}
              // The element's own clock: bent by its tempo swing, if any.
              time={warpTime(time, element.tempo)}
              assetUrl={assetUrl}
              fontBase={fontBase}
            />
          </group>
        );
      })}

      {editor && editor.tool !== 'off' && selected && selectedGroup ? (
        <TransformControls
          object={selectedGroup}
          mode={GIZMO_MODE[editor.tool]}
          size={0.8}
          onObjectChange={applyGizmo}
        />
      ) : null}

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
