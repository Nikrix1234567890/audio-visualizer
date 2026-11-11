// Elements built from things the user brings or types: their own 3D model
// and text. Both load something asynchronously (a file, a font), so both
// hold a server render back until the result is really in the picture -
// see useRenderHold.

import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Text as DreiText} from '@react-three/drei';
import {useThree} from '@react-three/fiber';
import {useDelayRender, useRemotionEnvironment} from 'remotion';
import {
  Box3,
  Color,
  Group,
  LoadingManager,
  PMREMGenerator,
  Vector3,
  type Material,
  type Mesh,
  type Object3D,
  type Texture,
  type WebGLRenderer,
} from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {fontFile} from './definitions';
import type {ElementProps} from './elements';

const num = (params: ElementProps['params'], key: string) => Number(params[key]);
const DEG_TO_RAD = Math.PI / 180;

/**
 * Holds a server render until asynchronous content has arrived AND been
 * drawn. During a render Remotion only redraws the 3D canvas when the frame
 * number changes, so content that shows up a moment later would be missing
 * from the captured frame.
 *
 * `hold(reason)` starts waiting and returns a release function for failures;
 * `drawn()` is called once the content is in the scene - it redraws the
 * canvas and lets the render continue.
 */
function useRenderHold() {
  const {delayRender, continueRender} = useDelayRender();
  const {isRendering} = useRemotionEnvironment();
  const advance = useThree((state) => state.advance);
  const pending = useRef<number | null>(null);

  const hold = useCallback(
    (reason: string) => {
      const handle = delayRender(reason);
      pending.current = handle;
      return () => {
        if (pending.current !== handle) return;
        pending.current = null;
        continueRender(handle);
      };
    },
    [delayRender, continueRender],
  );

  const drawn = useCallback(() => {
    const handle = pending.current;
    if (handle === null) return;
    if (isRendering) advance(performance.now());
    pending.current = null;
    continueRender(handle);
  }, [isRendering, advance, continueRender]);

  return {hold, drawn};
}

// ------------------------------------------------------------------------ Model

const studioEnvironments = new WeakMap<WebGLRenderer, Texture>();

/**
 * A neutral "photo studio" reflection map, generated in the browser (no
 * download). Imported models are usually made for image-based lighting and
 * look flat or black without one. It is applied to the model's own
 * materials only, so it does not change how other elements are lit.
 */
function getStudioEnvironment(renderer: WebGLRenderer): Texture {
  let environment = studioEnvironments.get(renderer);
  if (!environment) {
    const generator = new PMREMGenerator(renderer);
    environment = generator.fromScene(new RoomEnvironment(), 0.04).texture;
    generator.dispose();
    studioEnvironments.set(renderer, environment);
  }
  return environment;
}

function disposeObject(root: Object3D) {
  root.traverse((child) => {
    const mesh = child as Mesh;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!material) continue;
      for (const value of Object.values(material)) {
        // Free the model's own textures, but never the shared studio map.
        if ((value as Texture | null)?.isTexture && !studioMaps.has(value as Texture)) {
          (value as Texture).dispose();
        }
      }
      material.dispose();
    }
  });
}

const studioMaps = new WeakSet<Texture>();

type LoadedModel = {url: string; root: Group};

/** Sets how strongly the studio reflections light the model's materials. */
function applyStudioLight(root: Group, light: number) {
  for (const material of (root.userData.studioMaterials ?? []) as Material[]) {
    (material as Material & {envMapIntensity: number}).envMapIntensity = light;
  }
}

/**
 * Loads a GLB file and returns it centred and scaled to fit a 1x1x1 box, so
 * any model shows up at a sensible size whatever units it was made in.
 */
function useModel(url: string | null, light: number): Group | null {
  const [loaded, setLoaded] = useState<LoadedModel | null>(null);
  const renderer = useThree((state) => state.gl);
  const {hold, drawn} = useRenderHold();

  useEffect(() => {
    if (!url) return;
    const release = hold(`Loading 3D model ${url}`);
    let isCancelled = false;

    // A model file may point at other files by URL. Only the file itself
    // and data embedded in it are allowed - anything else is answered with
    // an empty response, so a model can never make the render server (or
    // the user's browser) fetch an address of the model author's choosing.
    const manager = new LoadingManager();
    manager.setURLModifier((requested) =>
      requested === url || requested.startsWith('data:') || requested.startsWith('blob:')
        ? requested
        : 'data:,',
    );

    const loader = new GLTFLoader(manager);
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      url,
      (gltf) => {
        if (isCancelled) {
          disposeObject(gltf.scene);
          return;
        }

        const bounds = new Box3().setFromObject(gltf.scene);
        const size = bounds.getSize(new Vector3());
        const longest = Math.max(size.x, size.y, size.z) || 1;
        gltf.scene.position.sub(bounds.getCenter(new Vector3()));
        const root = new Group();
        root.add(gltf.scene);
        root.scale.setScalar(1 / longest);

        const environment = getStudioEnvironment(renderer);
        studioMaps.add(environment);
        const found: Material[] = [];
        root.traverse((child) => {
          const material = (child as Mesh).material;
          for (const m of Array.isArray(material) ? material : [material]) {
            if (m && 'envMap' in m) {
              (m as Material & {envMap: Texture | null}).envMap = environment;
              found.push(m);
            }
          }
        });
        root.userData.studioMaterials = found;

        setLoaded({url, root});
      },
      undefined,
      // A file that cannot be read must not block the render forever.
      release,
    );

    return () => {
      isCancelled = true;
      release();
    };
  }, [url, renderer, hold]);

  // Free the previous model when another one replaces it or the element goes away.
  useEffect(() => {
    if (!loaded) return;
    return () => disposeObject(loaded.root);
  }, [loaded]);

  const isCurrent = Boolean(loaded && loaded.url === url);

  // Layout effects run before Remotion draws the frame, so the light level
  // (which may follow the audio) is always the one for this frame.
  useLayoutEffect(() => {
    if (loaded && isCurrent) applyStudioLight(loaded.root, light);
  }, [loaded, isCurrent, light]);

  useEffect(() => {
    if (isCurrent) drawn();
  }, [isCurrent, drawn]);

  return loaded && isCurrent ? loaded.root : null;
}

/**
 * The user's own 3D model (a .glb file), fitted to `size` and slowly
 * turning. Without a file it shows a wireframe box in the editor only.
 */
const Model: React.FC<ElementProps> = ({params, time, assetUrl}) => {
  const key = String(params.model ?? '');
  const size = num(params, 'size');
  const root = useModel(key ? assetUrl(key) : null, num(params, 'light'));
  const {isRendering} = useRemotionEnvironment();

  if (!root) {
    if (isRendering) return null;
    return (
      <mesh key="placeholder" scale={size}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#8b8a92" wireframe transparent opacity={0.35} />
      </mesh>
    );
  }

  return (
    <group
      key="model"
      scale={size}
      rotation={[0, time * num(params, 'spin') * DEG_TO_RAD, 0]}
    >
      <primitive object={root} />
    </group>
  );
};

// ------------------------------------------------------------------------- Text

/**
 * A line of text in the XY plane, facing +Z. The size is applied as a scale
 * rather than a font size: scaling is instant, while a new font size would
 * make the text lay itself out again in the background and arrive late.
 */
const TextLine: React.FC<{
  text: string;
  fontUrl: string;
  spacing: number;
  size: number;
  color: Color;
  y?: number;
  anchorY?: 'middle' | 'top' | 'bottom';
}> = ({text, fontUrl, spacing, size, color, y = 0, anchorY = 'middle'}) => {
  const {hold, drawn} = useRenderHold();

  // Everything that makes the text lay itself out again.
  const layoutKey = `${text}|${spacing}|${fontUrl}`;
  useEffect(() => {
    if (!text) return;
    return hold(`Laying out text "${text}"`);
  }, [layoutKey, text, hold]);

  if (!text) return null;

  return (
    <DreiText
      font={fontUrl}
      fontSize={1}
      scale={size}
      position={[0, y, 0]}
      letterSpacing={spacing}
      anchorX="center"
      anchorY={anchorY}
      onSync={drawn}
    >
      {text}
      <meshBasicMaterial color={color} toneMapped={false} />
    </DreiText>
  );
};

const TextElement: React.FC<ElementProps> = ({params, fontBase}) => (
  <TextLine
    text={String(params.text ?? '')}
    fontUrl={`${fontBase}/${fontFile(params.font)}`}
    spacing={num(params, 'spacing')}
    size={num(params, 'size')}
    color={new Color(String(params.color)).multiplyScalar(num(params, 'glow'))}
  />
);

/** A song title with the artist underneath, sharing one font. */
const TrackTitle: React.FC<ElementProps> = ({params, fontBase}) => {
  const fontUrl = `${fontBase}/${fontFile(params.font)}`;
  const glow = num(params, 'glow');
  const size = num(params, 'size');
  const gap = num(params, 'gap') * size;
  const spacing = num(params, 'spacing');

  return (
    <>
      <TextLine
        text={String(params.title ?? '')}
        fontUrl={fontUrl}
        spacing={spacing}
        size={size}
        color={new Color(String(params.color)).multiplyScalar(glow)}
        y={gap / 2}
        anchorY="bottom"
      />
      <TextLine
        text={String(params.artist ?? '')}
        fontUrl={fontUrl}
        spacing={spacing}
        size={size * num(params, 'artistSize')}
        color={new Color(String(params.artistColor)).multiplyScalar(glow)}
        y={-gap / 2}
        anchorY="top"
      />
    </>
  );
};

export const ASSET_ELEMENT_COMPONENTS = {
  model: Model,
  text: TextElement,
  trackTitle: TrackTitle,
};
