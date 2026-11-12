# Redesign: design system and UI previews

Started on 2026-11-12. The owner found the landing page and the editor too
plain for a product that should earn money. This folder holds the new look,
which the owner approved the same day. It has since been built into the app
(tokens, fonts, the editor, the pages outside the editor); `DESIGN.md` in
the repo root is the short version for working in the code.

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

## What has been built (2026-11-12)

- Tokens in `src/app/globals.css`, the three fonts in `src/app/layout.tsx`,
  the component classes in `src/app/components.css`.
- The editor in its new layout: `src/components/Editor.tsx` and
  `src/components/editor/` (`EditorAppBar`, `Library`, `Inspector`,
  `ExportPopover`), the controls in `src/components/ui/`, layout in
  `src/app/editor.css`.
- The pages outside the editor, with new ones for templates, features and
  help; layout in `src/app/site.css`.
- Animation with Motion throughout (rules in the brand book's Motion
  section).

## Still open

1. Accent: the app uses Phosphor (teal). Iris (violet) exists in the design
   system only.
2. Trademark and domain for "Beatframe"; the Premium price.
3. A lint rule against raw hex colours outside the tokens, and screenshot
   tests for the landing page and the editor.
4. The Motion AI kit (`npx motion-ai`) has not been installed; the
   animations were written against the library directly.
5. Dialogs still use the browser's own `confirm` and `prompt` in the editor
   (replace a scene, name a template); the design's Dialog component is not
   used for them yet.
