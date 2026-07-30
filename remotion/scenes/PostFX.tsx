import React from 'react';
import {EffectComposer, Bloom, Vignette} from '@react-three/postprocessing';
import {BlendFunction} from 'postprocessing';

/**
 * Shared cinematic post-processing stack for every scene: a soft bloom so
 * emissive materials actually glow (instead of just being a bright flat
 * color), plus a light vignette for depth/focus.
 */
export const PostFX: React.FC = () => {
  return (
    <EffectComposer>
      <Bloom
        mipmapBlur
        luminanceThreshold={0.15}
        luminanceSmoothing={0.3}
        intensity={1.4}
        radius={0.85}
      />
      <Vignette
        eskil={false}
        offset={0.15}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};
