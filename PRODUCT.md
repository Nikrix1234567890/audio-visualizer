# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Broad hobbyist audience: anyone who wants to turn a song into a cool video, purely for fun/personal use - not necessarily professional musicians, producers, or content creators. No assumed video-editing skill. Primary user right now (during early build-out) is the founder/developer themself, testing locally.

## Product Purpose

A fully browser-based tool that turns an uploaded audio file into an audio-reactive 3D visualizer video. Users upload a track, see an instant, interactive live 3D preview (driven by real audio spectrum analysis, not a placeholder), tweak visual settings, and export a downloadable MP4. No account/login is required for the core flow (a deliberate decision: product value first, accounts/persistence and monetization are layered on top later).

## Positioning

Live preview and final render share the exact same rendering code (React Three Fiber + Remotion composition) - what you see while editing is guaranteed to be what you get in the export, unlike tools where the preview and export use different rendering paths. Runs entirely in the browser for editing; rendering happens server-side for reliability. Long-term plan (not yet built): a light free tier and paid premium tier (higher resolution, no watermark, faster/priority rendering) - explicitly to fund making the project genuinely excellent, not primarily as a revenue play.

## Operating Context

Single-session workflow: open the site, drag/select an audio file, watch the live 3D preview react immediately, adjust visualizer settings (bar count, radius, colors, camera motion, resolution), click render, watch real render progress, download the finished MP4, and (typically) re-upload it elsewhere (YouTube, Instagram, TikTok, Spotify Canvas, etc.). Currently a single machine/dev environment; production deployment and multi-user concurrency are future work.

## Capabilities and Constraints

- Audio upload (WAV/MP3/M4A/AAC/OGG/FLAC), stored locally on disk for now (swappable for object storage like Cloudflare R2 later).
- Whole-track audio analysis (smoothed log-spaced spectrum, bass/mid/treble levels, beat detection) computed once per file and shared by every element of the React Three Fiber scene.
- A scene is a document the user composes from elements (bar ring, sphere swarm, terrain lines, glowing core, glow disc, sun, grid floor, stars, spectrum ring, particles, the user's own picture, the user's own 3D model, text, gradient backdrop, and a family of dense point-cloud elements: wave surface, particle disc, tunnel, helix, galaxy, spike orb, ripple rings, aurora, fireflies, digital rain, vortex, resonance plate, pendulum wave, hypercube, LED wall, radar, corona, sunflower, torus knot, jellyfish). The dense ones are animated on the graphics card: their points are uploaded once and a small shader places them every frame, so tens of thousands of points stay smooth in the preview: add, remove, hide, move, rotate, scale, and tune each one's parameters, plus scene-wide camera and look settings. Any continuous parameter - of an element, its position/rotation/scale, the camera or the look - can be patched to an audio signal (bass, mid, high, level, beat) with an adjustable amount. Colour palettes recolour a whole scene in one click. Templates are ready-made scenes offered as starting points, not fixed styles - each is nothing more than a few elements with chosen settings. Elements can be selected by clicking them in the preview and moved, rotated and scaled there with a gizmo. Pictures (PNG/JPG/WebP, up to 10 MB) and 3D models (.glb, up to 50 MB; no Draco-compressed files, no animations yet) are uploaded and stored like audio. Planned next: more fonts, vertical and square formats, free/premium limits.
- Render resolution is user-selectable (720p/1080p/1440p/4K) in three formats: landscape 16:9, portrait 9:16 and square 1:1. The resolution names the short side. In portrait the camera keeps its sideways angle and opens up vertically, so a scene built in landscape stays in the picture.
- The landing page is `/`, the editor `/editor` (`?project=`, `?template=`, `?scene=`), the plans `/pricing`, the account's projects and finished videos `/dashboard`.
- Plans: Free exports up to 720p at 30 fps with a small watermark; Premium up to 4K at 60 fps without one (`src/lib/tiers.ts`, enforced in the render route, shown in the editor). Payments go through Stripe Checkout and a signed webhook (`src/lib/stripe.ts`); until the Stripe keys are in `.env` the pricing page says Premium is not on sale. `pnpm tier <email> PREMIUM` sets a plan by hand.
- The editor has undo/redo, duplicating and reordering of elements, six typefaces for text, a Track Title element, and own templates that can be shared by link (scene only - no track, and no private pictures or models).
- Files of anonymous visitors (uploads and videos) are deleted after three days, automatically while uploading or with `pnpm cleanup` (`--dry-run` lists first). Files that belong to an account are never removed automatically.
- Keyframes: every fader that can react to audio can also change over time. The diamond next to a fader switches it on; from then on moving the fader sets a keyframe at the playhead, and the value travels between keyframes (linear, smooth or hold). Keyframes of the selected element, the camera and the look show as diamonds in the timeline - click to go there, drag to move. An audio binding is added on top of the keyframed value. Counts and speeds cannot be keyframed, for the same reason they cannot react to audio (`remotion/scene/keyframes.ts`).
- Tempo swing: every element has its own clock that can slow down and speed up again in a wave (amount and length under "Tempo" in the element's settings). Nine templates use it.
- The template gallery and the element catalogue show preview pictures from `public/thumbnails`, rendered by `pnpm thumbnails` with the same composition as every video. Run it again after changing a template or an element.
- The preview always plays at 60 frames per second (30 looked jerky with fast particles); the export frame rate is user-selectable, 60 (matches the preview) or 30 (renders in roughly half the time). A small readout above the preview shows the frames actually produced per second while playing.
- Rendering runs server-side via `@remotion/renderer`, tracked as an async job in a database (Prisma/SQLite locally) with real progress percentage, polled by the client.
- Accounts (email+password via Auth.js) are optional: the editor is fully usable anonymously, and signed-in users can save a project (title, track, scene, resolution) to their account, reopen it from the projects page at `/dashboard`, and delete it. A project belongs to exactly one account; nobody else can read or change it. Files uploaded and videos rendered while logged in belong to that account and are only handed to it (`src/lib/fileAccess.ts`); files from anonymous visitors have no owner and stay reachable by their random, unguessable address. Saving a project claims its ownerless files for the account. The editor warns before an edited, unsaved scene is left.
- Self-hosted Node process (not serverless) - render jobs run in the background of a long-lived server process.

## Brand Commitments

Working name: "Audio Visualizer" (functional placeholder, not a finalized brand - fine to keep for now, no logo or visual identity established yet).

## Evidence on Hand

None. No real user testimonials, case studies, or usage data exist yet - this is a pre-launch, actively-developed product. Nothing here should be fabricated for marketing purposes.

## Product Principles

1. Preview/render parity is non-negotiable - never let the live editor and the final export drift apart visually.
2. Core creative value (upload → configure → render) must stay usable without forcing signup; accounts are additive, not a gate.
3. Favor a small number of genuinely striking, well-made elements and templates over many shallow variants - the user's freedom comes from combining and tuning them.
4. Keep the render pipeline swap-friendly (local storage → object storage, single self-hosted process → queued/cloud rendering) without user-facing disruption.
5. English UI, built for an international, casual/hobbyist audience - approachable over technical/jargon-heavy.
