Beatframe turns a song into an audio-reactive 3D video in the browser. The interface is a dark studio: neutral, quiet and precise, so the user's picture is the only colourful thing on screen.

## Principles

1. **The picture is the colour.** Chrome is neutral graphite (`bg-0` to `bg-4`). The only saturated things are the user's scene, the one `accent`, and the five signal colours. No gradient fills, no glows behind pages, no tinted panels.
2. **White means go.** The one primary action of a view is the white `cta` button: "Open the editor" on marketing pages, "Export" in the editor. Never two on screen.
3. **Accent means lit.** `accent` marks what is selected, playing, focused or switched on, and nothing else. It is not decoration and not a headline colour.
4. **Every signal has a colour.** Bass, mids, highs, level and beat each own one colour (`sig-bass`, `sig-mid`, `sig-high`, `sig-level`, `sig-beat`) everywhere they appear. Anyone can see at a glance what drives what.
5. **Gold means Premium.** `premium` appears only where the paid plan does: a lock on a gated option, the Premium badge, the Upgrade button.
6. **Show the product, not adjectives.** Marketing pages are built from real editor components and real rendered videos. No illustrations, no stock, no invented numbers or quotes.
7. **Dense where you work, generous where you read.** The editor runs on a 4px grid at 13px text with 28px controls. Marketing pages use 15 to 18px text and 96 to 128px between sections.

## Voice and copy

- English, sentence case everywhere, including buttons, headings, tabs and labels. No ALL CAPS except the `overline` style.
- Talk to "you". Never "we" in the interface; "we" only where the company acts ("We sent a link").
- Plain words for a hobbyist: "Mids" not "mid-range band", "Reacts to" not "Bind", "Animate over time" not "Keyframe" on first contact. "Keyframe" is fine once the diamond has been used.
- Buttons are verb first and say what happens: "Export", "Save project", "Delete project", "Open the editor". The Toast repeats it in the past: "Project saved".
- Errors say what happened and what to do next, without "sorry", "oops" or "something went wrong": "This file is larger than 50 MB. Choose another."
- Numbers with units and a thin space: "720p", "60 fps", "0:30", "148 MB". Times as m:ss.
- No emoji, no exclamation marks.
- Do not write testimonials, user counts, star ratings or press logos until real ones exist. Leave the slot out.

Real copy to reuse:

- Hero: "Make your music impossible to scroll past." / "Drop in a track, pick a 3D scene and export a video that moves on every beat. In your browser, in minutes."
- Reassurance line under the hero buttons: "No account needed. Free 720p exports. What you see is the video."
- Section titles: "33 scenes to start from." · "From a song to a video in three steps." · "An editor, not a preset picker." · "Made for where it goes." · "Free to make videos. Premium when you want them bigger and unmarked." · "Your track is the only thing missing."

## Colour

- Grounds stack by height: `bg-0` (wells: stage, inputs, lanes) under `bg-1` (page) under `bg-2` (panels, cards) under `bg-3` (raised controls, menus) under `bg-4` (hovered, active segment). Never skip more than one step between a surface and what sits on it.
- Lines: `line-1` separates regions, `line-2` outlines controls, `line-3` is the hovered outline.
- Text: `ink-1` for what matters, `ink-2` for reading text and labels, `ink-3` for hints and metadata. `ink-4` is for marks only (unlit jacks, unplayed waveform), never for text.
- Hover adds `fill-1`, pressed adds `fill-2`. Selected is `accent-soft` with an `accent-line` border.
- `success`, `warning` and `danger` always come with an icon or a word.
- Two themes ship: **Phosphor** (teal accent, the default) and **Iris** (violet accent). They differ only in `accent`, `accent-hover`, `accent-soft`, `accent-line`, `on-accent`, `glow-accent` and `focus-ring`. Pick one for the product; do not offer a switch to users.
- The interface is dark only. There is no light theme: a video tool is judged against a dark surround.

## Type

- **Bricolage Grotesque** (`font-display`) for headlines on marketing pages, card titles, prices, the logo's name. Weight 650 to 700, tight tracking (-0.015 to -0.035em). Never below 20px, never in the editor's panels.
- **Geist** (`font-sans`) for everything else. The editor's base is `ui` (13/20); marketing body is `body` (15/24) and `body-lg` (18/28).
- **Geist Mono** (`font-mono`) for every number the user can change or watch: `readout` in scrub fields, `timecode` in the transport, hex colours, render sizes. Always with tabular figures.
- `overline` (mono, 10.5px, uppercase, 0.08em) is the only uppercase style. Use it for the eyebrow above a marketing section and for group labels in menus. Not for control labels, not for section headers in the inspector.
- Headlines get `text-wrap: balance`. Reading text stays under 65 characters per line.
- Load the three families with `next/font/google` and expose them as `--font-display`, `--font-sans`, `--font-mono`.

## Layout

- Marketing pages: content up to `content-max` (1200px), `space-6` gutter on desktop and `space-4` on phones. Sections are `space-32` apart on desktop, `space-24` on tablets, `space-16` on phones. A section is an eyebrow (`overline`, `accent`), a headline (`display-lg`), an optional lead (`body-lg`, `ink-2`), then `space-8` to its content. Headlines are left-aligned; only the closing call is centred.
- Grids are 12 columns with a `space-4` gap. Feature cards form a bento of unequal cards (spans 7+5, 5+7, 4+4+4), never a row of identical boxes.
- Breakpoints: 720px (nav collapses, grids go to one column), 1024px (editor switches from stacked to docked), 1280px (editor shows library and inspector together).

## Shape and depth

- Radii by size of the thing: `radius-xs` thumbnails and keys, `radius-sm` scrub fields and segments, `radius-md` buttons and inputs, `radius-lg` editor cards and menus, `radius-xl` marketing cards and dialogs, `radius-full` pills and the play button.
- Depth is borders first. `shadow-1` on raised controls, `shadow-2` on things that float over the editor, `shadow-3` on dialogs and the app window. Inputs and the stage are wells (`bg-0`, `shadow-well`).
- `glow-accent` is rare: the current template and the selected keyframe. Never more than one glow in a region.
- Blur exists in exactly one place, the marketing NavBar. Never blur anything over the stage; it costs frame rate.
- No gradients in the interface except the `accent-soft` wash at the top of the featured PricingCard and the user's own palettes.

## Iconography

- Lucide icons (`lucide-react`), 16px in controls, 18px in the Rail, 20 to 24px in empty states, stroke 1.75, always `currentColor`.
- An icon never replaces a label where there is room for the label. Icon-only buttons have an `aria-label` and a Tooltip with the shortcut.
- Two shapes are drawn in CSS, not icons: the jack (a ring with a dot) and the keyframe diamond. Do not substitute icons for them.
- No emoji, no filled icon style, no icons in coloured circles.

## Motion

Built with Motion (`motion/react`). A `MotionConfig` with `reducedMotion="user"` wraps the app, so every animation falls back to a plain fade for people who ask for less motion.

In the editor, motion is short and explains what happened:

- Controls change colour in 120ms. The pill of a SegmentedControl and the line under Tabs slide to the new choice (`layoutId`, spring 520 / 40).
- Sections, the SignalPatch panel and the keyframe panel fold open with their height in 160ms.
- Popovers, dialogs and the first-visit card spring in from their trigger (stiffness 380 to 520, damping 32 to 40) and leave faster than they came.
- Nothing loops except the live dot on a "Rendering" badge and values moving with the music. Nothing ever animates over the stage.

Outside the editor, motion is generous and shows the product:

- The hero headline arrives word by word; the app window settles flat as the page scrolls; inside it the editor is alive: meter, modulation bars, playhead.
- Sections, cards and rows rise in with a stagger when they scroll into view. Template cards lift on hover and play their loop.
- Filter chips share one sliding pill, and the grid re-flows when the filter changes.
- Feature demos react when they come into view or are hovered: a jack lights up, a value travels between two keyframes, the frame changes format.
- FAQ answers open with their height.

Rules for all of it:

- Animate `transform` and `opacity` (and layout). Never animate blur, never blur or cover the live 3D picture.
- Content is complete at rest. No text is hidden until an animation runs, and every page reads the same with reduced motion.
- Looping work pauses while it is off-screen.
- One strong moment per section. If two things compete, the second one only fades.

## States

Every interactive component defines rest, hover, pressed, focus-visible, disabled and, where it applies, selected, loading and error.

- Focus: `focus-ring`, a solid 2px `accent` ring with a 2px `bg-1` gap, on every focusable element. Never removed.
- Disabled: 40% opacity and no pointer events. If something is unavailable because of the plan, it is not disabled: it is locked, readable, and opens the upgrade message.
- Loading: buttons keep their width and show a spinner (`aria-busy`). Panels show their last content dimmed, never a blank.
- Destructive actions are undoable with a Toast, except deleting a project or an account, which ask in a Dialog.

## Accessibility

- Text is at least 4.5:1 on its ground; `ink-3` is the lightest text colour and holds that on `bg-0` to `bg-3`.
- Minimum text size is 11px (`micro`), and only for badges and chips.
- Hit areas are at least 24px in the editor and 40px on marketing and account pages; 44px on touch.
- Everything works from the keyboard. The editor's shortcuts are listed under `?` and shown in tooltips.
- Signal colours are always paired with the signal's name on first contact (chip, tooltip on a dot).

## The editor

The editor is a full-window app with its own AppBar. It does not show the marketing NavBar.

```
┌──────────────────────────────── AppBar 48 ────────────────────────────────┐
│ mark · title · saved      undo redo · 16:9 9:16 1:1      plan Share Export │
├──────┬───────────────┬──────────────────────────────────┬──────────────────┤
│ Rail │ Library 288   │ Stage                            │ Inspector 320    │
│ 56   │ (what you can │ (the frame, floating toolbar)    │ (what is         │
│      │  add)         │                                  │  selected)       │
├──────┴───────────────┴──────────────────────────────────┴──────────────────┤
│ Transport 44 · Timeline (ruler, waveform, keyframe lanes)      232         │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Left is what you can add, right is what you selected, bottom is time.** Do not mix them.
- **Library** (chosen by the Rail): Templates (TemplateCard, two per row), Elements (ElementTile, three per row, searchable), Media (your pictures and models, with an inline DropZone), Text (Text, Track title, Lyrics), Palettes.
- **Inspector**: the layer list (LayerRow) on top, at most 40% of the height, then Tabs: Element, Camera, Look. Each tab is a stack of Sections of ParamRows. With nothing selected the Element tab says "Select an element in the picture or the list."
- **Stage**: the frame in its export format on a dotted well, the floating toolbar on top. Before a track is loaded, the large DropZone with "Use the demo track".
- **Timeline**: Transport, then ruler, waveform and one lane per animated setting. The seams between library, stage, inspector and timeline are draggable; double-click resets one.
- **Export** lives in a popover under the app bar's Export button, not in the sidebar. Plan limits are shown there as locked segments.
- First visit: the stage's DropZone is the onboarding. After a track loads, three coach marks appear once, one at a time: "Pick a scene" on the library, "Click anything to change it" on the stage, "Export when you like it" on the Export button. Each has "Next" and "Skip".
- Below 1024px: stage on top, transport under it, then one panel with tabs (Library, Scene, Settings). Export stays in the app bar.
- Keyboard: Space play, V/G/R/S tools, 1 to 5 rail, ⌘Z / ⇧⌘Z undo and redo, ⌘D duplicate, Delete remove, ⌘S save, ⌘E export, ? shortcuts.

## Marketing pages

Landing page, top to bottom:

1. NavBar.
2. Hero: eyebrow Badge, headline (`display-xl`), lead (`body-lg`), the cta "Start with your track" and the secondary "Browse templates", the reassurance line. Under it, full width, the AppWindow with the editor playing a real scene. Dropping an audio file anywhere on the page opens the editor with it.
3. A single line of where videos go, in `ink-3`: "Made for YouTube, Reels, TikTok, Shorts and Spotify Canvas." Words, not logos.
4. Templates: FilterChips and a grid of TemplateCards that play on hover; "See all 33" at the end.
5. How it works: three StepCards.
6. Features: a bento of FeatureCards, each with a working piece of the editor.
7. Formats: three frames (16:9, 9:16, 1:1) of the same scene, the 9:16 one in a phone.
8. Pricing: two PricingCards, then the CompareTable.
9. FAQ.
10. Closing call, centred: headline, the cta, and a DropZone.
11. Footer.

Pricing page: headline, PricingCards, CompareTable, FAQ, closing call. Dashboard: title, "Start from" row of templates, the ProjectCard grid, then finished videos as RenderJob rows. Login, sign-up and reset: the AuthCard centred on `bg-1` with the logo above.

## Using this in the codebase

- The tokens map one to one to CSS variables in `src/app/globals.css` and to Tailwind theme colours (`bg-bg-2`, `text-ink-2`, `border-line-1`). Components use token names only; a raw hex value in a component is a bug.
- Two colours are drawn on a canvas or inside the rendered video and cannot read CSS variables: the waveform (`ink-4` and `accent`) and the watermark. Keep them in one constants file next to the tokens.
- `components/bundle.css` in this system is the reference for every measurement. The app's `src/app/components.css` is derived from it (without the preview scaffolding); change both together.
