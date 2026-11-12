# Redesign: design system and UI previews

Started on 2026-11-12. The owner found the landing page and the editor too
plain for a product that should earn money. This folder holds the proposed
new look. **Nothing in `src/` has been changed yet**, and `DESIGN.md` in the
repo root still describes the old "Night Signal" look.

## Where to look

Both pages are private to the owner's claude.ai account and open on any
computer that is logged in to it:

- Design system (tokens, 41 components with live previews, brand book):
  https://claude.ai/artifact/QJopAkLwhL1gC27DCxw8Qq
- UI previews (landing page, editor, editor on first visit, dashboard):
  https://claude.ai/artifact/2jM2LE65TcW6JDtJj1WSc2
  In the editor artboard press Play: Export, the audio jack next to
  "Arm width", the left rail and the inspector tabs can be clicked.

## What is in this folder

- `design-system/` - the sources of the design system page.
  - `README.md` - the brand book: principles, voice, colour, type, layout,
    motion, states, the editor's layout, the landing page's structure.
    **Read this first.**
  - `tokens.json` - every colour, text style, spacing, radius, shadow, size.
  - `components/bundle.css` - the reference stylesheet for all components.
  - `components/<Name>/preview.html` and `README.md` - one live example and
    the usage rules per component.
  - `components/bundle.js` - icon paths and a waveform filler for the
    previews only.
- `canvas/` - the sources of the four artboards (`*.dc.html`), their shared
  layout stylesheet `redesign.css` and `ds/pulsefield/tokens.css`, the tokens
  compiled to CSS variables.
- `generate-components.py` - writes the component previews and guidelines.
  Change a component there, then run
  `python3 design/generate-components.py design/design-system`.

The pictures in the previews are addressed as `/_blob/<id>`; they are copies
of files in `public/thumbnails` and `public/previews` stored with the two
pages, so the HTML files here do not show pictures when opened from disk.

## The direction in short

- Neutral graphite surfaces; the user's video is the only colourful thing.
- The one main action of a view is a white button.
- One accent colour for "selected / playing / on". Two variants exist:
  Phosphor (teal, default) and Iris (violet).
- Bass, mids, highs, level and beat each have one fixed colour everywhere.
- Gold appears only where Premium does.
- Fonts: Bricolage Grotesque (headlines), Geist (interface), Geist Mono
  (numbers).
- Editor: its own top bar; library on the left, layers and settings on the
  right, timeline at the bottom, export in a popover.

## Open decisions (the owner's)

1. Is the direction approved, and which accent: Phosphor or Iris?
2. ~~Name and logo.~~ Decided on 2026-11-12: the name is "Beatframe", the
   logo is the nine-dot sound figure (option D's mark on the "Names and
   logos" artboard). Still to do: check trademark and domain.
3. The Premium price (the previews show "[YOUR PRICE]").

## Animation

The owner wants many animations in the design and on the site, built with
Motion (motion.dev) and its AI kit. Install the kit once per machine with
`npx motion-ai` (interactive; choose Claude Code), then restart the session
so its docs search is available. The brand book's Motion section is still
the restrained first draft and has to be rewritten for this.

## Next steps once approved

1. Put the tokens into `src/app/globals.css` and load the three fonts with
   `next/font/google` in `src/app/layout.tsx`.
2. Add `lucide-react` (icons) and an accessible primitives library (Radix or
   Base UI) for menus, popovers, dialogs and tooltips.
3. Rebuild `src/components/ui` from `components/bundle.css`, component by
   component, starting with Button, ParamRow (replaces `SliderRow`),
   SegmentedControl.
4. Rebuild the editor shell (`src/components/Editor.tsx`, `editor/Sidebar.tsx`,
   `editor/Transport.tsx`) in the new layout.
5. Rebuild the landing page (`src/app/page.tsx`), then pricing, dashboard and
   the login pages.
6. Rewrite `DESIGN.md` for the new system; add a lint rule against raw hex
   colours outside the tokens and screenshot tests for landing page and editor.
7. Templates need a `category` field before the gallery filters can ship.
