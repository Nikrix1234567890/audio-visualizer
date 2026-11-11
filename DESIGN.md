---
name: Pulsefield
description: Night-sky violet and cyan around a live 3D picture.
colors:
  canvas: "#0a0a18"
  surface: "#121127"
  surface-raised: "#1b1a38"
  line: "#2b2952"
  ink: "#f2f0ff"
  muted: "#9794bd"
  accent: "#a78bfa"
  accent-dim: "#4a3d94"
  accent-2: "#22d3ee"
typography:
  display:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 1.05
  body:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    letterSpacing: "0.08em"
rounded:
  panel: "16px"
  button: "12px"
  selector: "999px"
---

# Design System: Pulsefield

"Pulsefield" is a working title; nobody has checked whether the name is free.
It lives in one file, `remotion/brand.ts`.

## Creative North Star: "Night Signal"

A dark night sky with one signal running through it: violet that turns into
cyan. The page stays quiet so the 3D picture is the brightest thing on it.
This replaced the earlier "Patch Bay" look (black, graphite and amber, styled
like synthesizer hardware), which the owner no longer wanted.

## Where the look lives

Every colour, shadow and font is a token in `src/app/globals.css`. Components
only use the token names (`bg-canvas`, `bg-surface`, `bg-surface-raised`,
`border-line`, `text-ink`, `text-muted`, `text-accent`, `border-accent-dim`).
A new palette means editing that one block.

Two colours are repeated outside the tokens because they are drawn on a
canvas or inside a rendered video, where CSS variables do not reach: the
waveform colours in `src/components/editor/Waveform.tsx` and the watermark
in `remotion/compositions/AudioVisualizer3D.tsx`.

## Rules

- **Night first.** `canvas` is the page, `surface` a panel on it,
  `surface-raised` a control on a panel, `line` every border between them.
- **One signal.** `accent` (violet) means lit, active, selected - and nothing
  else. Its unlit counterpart is `accent-dim`: an indicator that is off, a
  track that is not filled. Do not use the accent as decoration.
- **The gradient is the brand.** Violet to cyan (`.bg-brand`, `.text-brand`)
  appears on the primary button of a page, in the wordmark and in headline
  highlights - a few times per page, never as a panel background.
- **Glow, not chrome.** Depth comes from soft glows (`.aurora` behind pages,
  `.surface-texture` on panels, `shadow-glow-active` on lit controls), not
  from bevels, rivets or textures.
- **Glass only on pages.** `.glass` cards (translucent, blurred) belong on
  the landing and pricing pages. Never put a blur over the editor's 3D
  preview: blurring a WebGL canvas every frame costs frame rate.
- **Labels are small mono caps.** Section labels, units and numeric readouts
  use the mono font at 11px with wide tracking; everything else is Sora.
- **Rounded, not pill-shaped.** Panels 16px, buttons 12px, small controls
  6px; only the segmented selectors are fully round.
- **Motion with a reason.** Sections rise in once as they scroll into view
  (`.reveal`); controls only change colour and glow. Everything honours
  `prefers-reduced-motion`.

## Components

- **Fader** (`SliderRow`): thin track in `accent-dim`, filled in `accent`,
  the value as a field you can type into. Next to the caption sit the audio
  jack (round) and the keyframe switch (diamond); both light up in `accent`
  when on.
- **Segmented selector**: a round-ended row; the active segment is raised
  and glows. A locked (Premium) segment is dimmed.
- **Preview frame**: a `surface` panel with a recessed inner shadow around
  the picture - no controls on it; playback lives in the transport bar.
- **Timeline**: the waveform, played part in `accent`; beats as ticks along
  the bottom, keyframes as diamonds along the top (the selected element's
  filled, camera and look outlined).
- **Primary button**: brand gradient, dark text. **Secondary button**:
  `surface-raised` with a `line` border that turns `accent-dim` on hover.
