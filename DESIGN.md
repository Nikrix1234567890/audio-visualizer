---
name: Beatframe
description: A dark studio in neutral graphite; the user's video is the only colourful thing on screen.
colors:
  bg-0: "#08090c"
  bg-1: "#0c0d11"
  bg-2: "#121419"
  bg-3: "#1a1d24"
  bg-4: "#232730"
  line-1: "#1f232b"
  line-2: "#2f3540"
  line-3: "#4a5263"
  ink-1: "#f4f5f7"
  ink-2: "#b4b9c4"
  ink-3: "#868d9c"
  ink-4: "#596070"
  cta: "#f4f5f7"
  accent: "#3ee6c1"
  sig-bass: "#ff6a3d"
  sig-mid: "#b8e04a"
  sig-high: "#4da6ff"
  sig-level: "#e2e6ee"
  sig-beat: "#ff5fc4"
  premium: "#f2c260"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Geist, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 700
    lineHeight: 0.96
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    lineHeight: 1.54
  data:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
rounded:
  control: "8px"
  card: "12px"
  marketing-card: "20px"
---

# Design System: Beatframe

The full system - tokens, every component with a live example and its rules,
the brand book - lives in `design/` (start with `design/README.md` and
`design/design-system/README.md`). This file is the short version for
working in the code. It replaced the earlier "Night Signal" look (violet to
cyan) on 2026-11-12.

## Where the look lives

- **Tokens**: `src/app/globals.css`. Every colour, shadow, radius and font
  is a CSS variable there and a Tailwind colour (`bg-bg-2`, `text-ink-2`,
  `border-line-1`). They mirror `design/design-system/tokens.json`.
- **Components**: `src/app/components.css` holds the `pf-` classes
  (`pf-btn`, `pf-scrub`, `pf-seg`, `pf-layer`, `pf-card` ...). It is
  derived from `design/design-system/components/bundle.css` and loaded in
  the CSS layer "components", so a Tailwind utility on the same element
  wins.
- **Layout**: `src/app/editor.css` (the editor shell, `ed-`/`ed__`) and
  `src/app/site.css` (pages outside the editor, `lp-`, `db-`).
- **Icons**: `lucide-react`, `className="pf-i"` (16px, stroke 1.75).
- **Animation**: Motion (`motion/react`). `MotionProvider` in
  `src/components/SiteChrome.tsx` makes every animation honour the
  visitor's reduced-motion setting.

Two things are drawn outside CSS and repeat token values by hand: the
waveform colours in `src/components/editor/Waveform.tsx` and the watermark
in `remotion/compositions/AudioVisualizer3D.tsx`.

The names of the earlier look (`bg-canvas`, `bg-surface`, `text-muted`,
`.glass`, `.bg-brand`, `.aurora` ...) still resolve to the new values so
nothing breaks. Do not use them in new code; remove them where you touch a
file.

## Rules

- **The picture is the colour.** Chrome is neutral graphite (`bg-0` to
  `bg-4`). No gradient fills, no glows behind pages, no tinted panels.
- **White means go.** The one main action of a view is the white `cta`
  button ("Open the editor", "Export"). Never two on screen.
- **Accent means lit.** `accent` marks what is selected, playing, focused or
  switched on, and nothing else.
- **Every signal has a colour.** Bass, mids, highs, level and beat each own
  one colour (`sig-*`) everywhere they appear: the jack, the bar under a
  scrub field, the dots on a layer, the beat ticks. Never use them for
  anything else.
- **Gold means Premium.** `premium` appears only where the paid plan does.
- **Sentence case.** No all-caps labels; numbers the user can change are in
  the mono face.
- **Never blur or cover the stage.** It costs frame rate.

## The editor

Its own top bar (`EditorAppBar`); the site's nav is hidden on `/editor`.
Left is what you can add (`Library`: rail and panel), right is what is
selected (`Inspector`: layers, then Element / Camera / Look), bottom is
time (`Transport`: transport bar, waveform, one lane per animated setting).
Export is a popover under the Export button (`ExportPopover`). The seams
between the panels can be dragged; below 1024px everything stacks.

A number is a scrub field (`SliderRow`): drag sideways, double-click to
type. `BindableSlider` adds the audio jack and the keyframe diamond.

## Motion

Editor: short and functional - 120 to 180 ms, springs for the sliding pill
of a segmented control and the tab line (`layoutId`), panels fold open with
their height, popovers spring from their trigger. Nothing loops and nothing
moves over the stage.

Pages outside the editor: generous - reveals on scroll, a living picture of
the editor in the hero, demos that react when they come into view. Animate
`transform` and `opacity`; content is readable at rest and with reduced
motion; looping work pauses off-screen.
