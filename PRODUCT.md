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
- A scene is a document the user composes from elements (bar ring, sphere swarm, terrain lines, glowing core, glow disc, sun, grid floor, stars, spectrum ring, particles, the user's own picture, the user's own 3D model, text, gradient backdrop, and a family of dense point-cloud elements: wave surface, particle disc, tunnel, helix, galaxy, spike orb, ripple rings, aurora, fireflies, digital rain): add, remove, hide, move, rotate, scale, and tune each one's parameters, plus scene-wide camera and look settings. Any continuous parameter - of an element, its position/rotation/scale, the camera or the look - can be patched to an audio signal (bass, mid, high, level, beat) with an adjustable amount. Colour palettes recolour a whole scene in one click. Templates are ready-made scenes offered as starting points, not fixed styles - each is nothing more than a few elements with chosen settings. Elements can be selected by clicking them in the preview and moved, rotated and scaled there with a gizmo. Pictures (PNG/JPG/WebP, up to 10 MB) and 3D models (.glb, up to 50 MB; no Draco-compressed files, no animations yet) are uploaded and stored like audio. Planned next: more fonts, vertical and square formats, free/premium limits.
- Render resolution is user-selectable (720p/1080p/1440p/4K), always 16:9 for now.
- Rendering runs server-side via `@remotion/renderer`, tracked as an async job in a database (Prisma/SQLite locally) with real progress percentage, polled by the client.
- Accounts (email+password via Auth.js) are optional: the editor is fully usable anonymously, and signed-in users can save a project (title, track, scene, resolution) to their account, reopen it from the projects page at `/dashboard`, and delete it. A project belongs to exactly one account; nobody else can read or change it. Render jobs are not yet linked to accounts, and uploaded files are reachable by anyone who knows their (random, unguessable) address.
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
