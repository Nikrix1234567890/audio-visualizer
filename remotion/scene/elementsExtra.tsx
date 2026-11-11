// Element types added after the first three templates: a flat spectrum ring,
// a particle field, an image and a gradient backdrop. Same rules as in
// ./elements.tsx - each one is a pure function of (params, audio, time).

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useThree} from '@react-three/fiber';
import {useDelayRender, useRemotionEnvironment} from 'remotion';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  Color,
  DataTexture,
  DoubleSide,
  RGBAFormat,
  SRGBColorSpace,
  SphereGeometry,
  TextureLoader,
  type Texture,
} from 'three';
import {BAND_COUNT, getBassTravel, getSpectrum} from '../audio/analysis';
import type {ElementProps} from './elements';

const num = (params: ElementProps['params'], key: string) => Number(params[key]);
const TWO_PI = Math.PI * 2;

/** hsl (hue in degrees, s and l 0..1) -> linear-ish rgb triple for vertex colours. */
function hueToRgb(hue: number, saturation: number, lightness: number) {
  const color = new Color();
  color.setHSL((((hue % 360) + 360) % 360) / 360, saturation, lightness);
  return color;
}

// ---------------------------------------------------------------- Spectrum Ring

const LAYER_DELAY_SECONDS = 0.045;

/**
 * A flat ring (in the XY plane, facing +Z) whose outer edge bulges with the
 * spectrum - the classic "pulsing circle" music visual. With `mirror` the
 * left half repeats the right half, so the bass sits at the bottom and the
 * shape stays symmetric. Extra layers trail slightly behind in time, each a
 * little larger and fainter, which gives the edge its coloured echo.
 */
const SpectrumRing: React.FC<ElementProps> = ({params, analysis, time}) => {
  const points = Math.round(num(params, 'points'));
  const radius = num(params, 'radius');
  const height = num(params, 'height');
  const range = num(params, 'range');
  const layers = Math.round(num(params, 'layers'));
  const hueStart = num(params, 'hueStart');
  const hueEnd = num(params, 'hueEnd');
  const mirror = Boolean(params.mirror);

  // Triangle indices for a closed strip of `points` inner/outer vertex pairs.
  const index = useMemo(() => {
    const out = new Uint16Array(points * 6);
    for (let i = 0; i < points; i++) {
      const next = (i + 1) % points;
      out.set([i * 2, i * 2 + 1, next * 2, next * 2, i * 2 + 1, next * 2 + 1], i * 6);
    }
    return new BufferAttribute(out, 1);
  }, [points]);

  return (
    <>
      {new Array(layers).fill(0).map((_, layer) => {
        const spectrum = getSpectrum(
          analysis,
          Math.max(0, time - layer * LAYER_DELAY_SECONDS),
          BAND_COUNT,
        );
        const positions = new Float32Array(points * 6);
        const colors = new Float32Array(points * 6);
        const layerHeight = height * (1 + layer * 0.35);
        const hueShift = layer * 28;

        for (let i = 0; i < points; i++) {
          // 0..1 around the ring, starting at the bottom.
          const around = i / points;
          // Position in the spectrum: 0..1, mirrored so both halves match.
          const across = mirror ? 1 - Math.abs(around * 2 - 1) : around;
          const band = across * range * (BAND_COUNT - 1);
          const lower = Math.floor(band);
          const upper = Math.min(BAND_COUNT - 1, lower + 1);
          const level =
            spectrum[lower] + (spectrum[upper] - spectrum[lower]) * (band - lower);

          const angle = around * TWO_PI - Math.PI / 2;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const outer = radius + 0.04 + level * layerHeight;

          positions.set([cos * radius, sin * radius, 0, cos * outer, sin * outer, 0], i * 6);

          const color = hueToRgb(
            hueStart + across * (hueEnd - hueStart) + hueShift,
            1,
            0.5 + level * 0.15,
          );
          colors.set([color.r, color.g, color.b, color.r, color.g, color.b], i * 6);
        }

        return (
          <mesh key={layer} position={[0, 0, -layer * 0.02]} renderOrder={-layer}>
            <bufferGeometry>
              <primitive attach="index" object={index} />
              <bufferAttribute attach="attributes-position" args={[positions, 3]} />
              <bufferAttribute attach="attributes-color" args={[colors, 3]} />
            </bufferGeometry>
            <meshBasicMaterial
              vertexColors
              side={DoubleSide}
              transparent
              opacity={layer === 0 ? 1 : 0.55 / layer}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </>
  );
};

// -------------------------------------------------------------------- Particles

/** Small deterministic random generator, so particle positions never change between renders. */
export function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let softDot: DataTexture | null = null;

/** A round, soft-edged dot used as the sprite for every particle. */
export function getSoftDot(): DataTexture {
  if (softDot) return softDot;
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const falloff = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2);
      data.set([255, 255, 255, Math.round(255 * falloff * falloff)], (y * size + x) * 4);
    }
  }
  softDot = new DataTexture(data, size, size, RGBAFormat);
  softDot.needsUpdate = true;
  return softDot;
}

/**
 * A field of particles drifting toward the viewer (+Z) and wrapping around.
 * `speed` is the steady drift; `boost` adds distance in proportion to how
 * much bass has played so far, so the field surges with the music without
 * ever jumping.
 */
const Particles: React.FC<ElementProps> = ({params, analysis, time}) => {
  const count = Math.round(num(params, 'count'));
  const spread = num(params, 'spread');
  const depth = num(params, 'depth');
  const hole = num(params, 'hole');

  // Where each particle starts: x, y in a ring around the centre, z in the depth.
  const seeds = useMemo(() => {
    const random = seededRandom(1337);
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      out.set([random(), random(), random()], i * 3);
    }
    return out;
  }, [count]);

  const travel =
    time * num(params, 'speed') + getBassTravel(analysis, time) * num(params, 'boost');

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = seeds[i * 3] * TWO_PI;
    // sqrt keeps the particles evenly spread over the area instead of clumped in the middle.
    const distance = hole + Math.sqrt(seeds[i * 3 + 1]) * (spread - hole);
    const z = ((seeds[i * 3 + 2] * depth + travel) % depth) - depth / 2;
    positions.set([Math.cos(angle) * distance, Math.sin(angle) * distance, z], i * 3);
  }

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={getSoftDot()}
        color={hueToRgb(num(params, 'hue'), num(params, 'saturation'), 0.7)}
        size={num(params, 'size')}
        sizeAttenuation
        transparent
        opacity={num(params, 'opacity')}
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
};

// ------------------------------------------------------------------------ Image

/**
 * Loads an image as a texture and makes a server render wait for it.
 *
 * During a render Remotion only redraws the 3D canvas when the frame number
 * changes. A picture that arrives a moment after a frame was drawn would
 * therefore be missing from that frame, so the render is held back until
 * the picture is in the scene AND the canvas has been drawn again with it.
 */
function useImageTexture(url: string | null): Texture | null {
  const [loaded, setLoaded] = useState<{url: string; texture: Texture} | null>(null);
  const {delayRender, continueRender} = useDelayRender();
  const {isRendering} = useRemotionEnvironment();
  const advance = useThree((state) => state.advance);
  const pendingHandle = useRef<number | null>(null);

  useEffect(() => {
    if (!url) return;
    const handle = delayRender(`Loading image ${url}`);
    pendingHandle.current = handle;
    let isCancelled = false;

    const release = () => {
      if (pendingHandle.current !== handle) return;
      pendingHandle.current = null;
      continueRender(handle);
    };

    new TextureLoader().load(
      url,
      (texture) => {
        if (isCancelled) return;
        texture.colorSpace = SRGBColorSpace;
        // The hold is released by the effect below, after the redraw.
        setLoaded({url, texture});
      },
      undefined,
      // A picture that fails to load must not block the render forever.
      release,
    );

    return () => {
      isCancelled = true;
      release();
    };
  }, [url, delayRender, continueRender]);

  useEffect(() => {
    const handle = pendingHandle.current;
    if (!loaded || loaded.url !== url || handle === null) return;
    if (isRendering) advance(performance.now());
    pendingHandle.current = null;
    continueRender(handle);
  }, [loaded, url, isRendering, advance, continueRender]);

  return loaded && loaded.url === url ? loaded.texture : null;
}

/**
 * A picture in the scene - a cover, a logo, a photo. Lies in the XY plane
 * facing +Z. `round` crops it to a circle (centred, never stretched).
 * Without a picture it shows a faint placeholder in the editor only.
 */
const Image: React.FC<ElementProps> = ({params, assetUrl}) => {
  const key = String(params.image ?? '');
  const size = num(params, 'size');
  const round = Boolean(params.round);
  const source = useImageTexture(key ? assetUrl(key) : null);
  const {isRendering} = useRemotionEnvironment();

  // A private copy so cropping never changes the cached original.
  const texture = useMemo(() => {
    if (!source) return null;
    const copy = source.clone();
    const {width, height} = source.image as {width: number; height: number};
    const aspect = width / height;
    if (round) {
      // Show the centred square part of the picture.
      if (aspect > 1) {
        copy.repeat.set(1 / aspect, 1);
        copy.offset.set((1 - 1 / aspect) / 2, 0);
      } else {
        copy.repeat.set(1, aspect);
        copy.offset.set(0, (1 - aspect) / 2);
      }
    }
    copy.needsUpdate = true;
    return {map: copy, aspect};
  }, [source, round]);

  useEffect(() => () => texture?.map.dispose(), [texture]);

  if (!texture) {
    if (isRendering) return null;
    // Different keys for placeholder and picture: the material must be
    // built fresh when a texture appears, or the shader ignores the map.
    return (
      <mesh key="placeholder">
        {round ? (
          <circleGeometry args={[size / 2, 64]} />
        ) : (
          <planeGeometry args={[size, size]} />
        )}
        <meshBasicMaterial color="#8b8a92" transparent opacity={0.12} side={DoubleSide} />
      </mesh>
    );
  }

  // Rectangular pictures keep their shape; `size` is the longer side.
  const width = texture.aspect >= 1 ? size : size * texture.aspect;
  const height = texture.aspect >= 1 ? size / texture.aspect : size;

  return (
    <mesh key="picture">
      {round ? (
        <circleGeometry args={[size / 2, 64]} />
      ) : (
        <planeGeometry args={[width, height]} />
      )}
      <meshBasicMaterial
        map={texture.map}
        transparent
        opacity={num(params, 'opacity')}
        side={DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
};

// --------------------------------------------------------------------- Backdrop

const BACKDROP_RADIUS = 400;

/**
 * A two-colour gradient filling the whole background, from `bottom` to
 * `top`. Drawn behind everything and ignored by fog.
 */
const Backdrop: React.FC<ElementProps> = ({params}) => {
  const top = String(params.top);
  const bottom = String(params.bottom);

  const geometry = useMemo(() => {
    const sphere = new SphereGeometry(1, 32, 24);
    const position = sphere.getAttribute('position');
    const colors = new Float32Array(position.count * 3);
    const topColor = new Color(top);
    const bottomColor = new Color(bottom);
    const mixed = new Color();

    for (let i = 0; i < position.count; i++) {
      mixed.lerpColors(bottomColor, topColor, (position.getY(i) + 1) / 2);
      colors.set([mixed.r, mixed.g, mixed.b], i * 3);
    }
    sphere.setAttribute('color', new BufferAttribute(colors, 3));
    return sphere;
  }, [top, bottom]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} scale={BACKDROP_RADIUS} renderOrder={-1000} frustumCulled={false}>
      <meshBasicMaterial
        vertexColors
        side={BackSide}
        fog={false}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
};

export const EXTRA_ELEMENT_COMPONENTS = {
  spectrumRing: SpectrumRing,
  particles: Particles,
  image: Image,
  backdrop: Backdrop,
};
