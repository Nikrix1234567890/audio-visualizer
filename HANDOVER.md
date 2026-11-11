# Handover

For the agent (or person) picking this project up on another machine.
Written on 2026-11-11 and extended in the night to 2026-11-12, at the end
of a long session on a Windows PC; the next session is on a Mac.

## What this is

**Pulsefield** (a working title - nobody has checked whether the name is
free) is a web app that turns a song into an audio-reactive 3D video. The
user loads a track, builds a scene from elements, wires settings to the
music, and renders an MP4 on the server. Free plan with a watermark, a paid
Premium plan through Stripe.

Read these first, in this order:

1. `AGENTS.md` - this is Next.js 16; read the matching guide in
   `node_modules/next/dist/docs/` before writing Next code.
2. `PRODUCT.md` - what the product does and the rules it follows.
3. `DESIGN.md` - the look ("Night Signal") and where it lives.
4. `DEPLOY.md` - how to put it on a server (written, never tried).

## Working with the owner

- The owner writes German and wants answers in German. Code, comments, UI
  text and commit messages are English.
- **Commit every finished stage yourself and push it** to `origin main`.
  The owner asked for this explicitly; work happens directly on `main`.
- The repository is `https://github.com/Nikrix1234567890/audio-visualizer`,
  the owner's private GitHub account. **Never push to any other account**
  (there is a company account; it must not get this code).
- Git identity is per machine and is not cloned. Set it in this repository
  before the first commit, so no private mail address ends up in the
  history:

  ```bash
  git config user.name "Nikrix1234567890"
  ```

  ```bash
  git config user.email "113694992+Nikrix1234567890@users.noreply.github.com"
  ```

- When testing in a browser the owner can hear, mute the sound first
  (`localStorage['editor.muted'] = 'true'` before loading a track).
- For large changes, propose first; for everything else, just do it and
  report plainly what was and was not verified.

## Setting up a fresh checkout

Needs Node 20 or newer and pnpm 9.

```bash
pnpm install
```

```bash
cp .env.example .env
```

Put a generated secret into `AUTH_SECRET` in `.env` (the command is in
`.env.example`). Then create the database and the render bundle:

```bash
pnpm exec prisma migrate deploy
```

```bash
pnpm remotion:bundle
```

```bash
pnpm dev
```

The app is then at `http://localhost:3000`. Development mode is about three
times slower than a build; for judging smoothness use the build:

```bash
pnpm build
```

```bash
pnpm start
```

Not in the repository, so missing on a new machine: `.env`, the database
(`prisma/dev.db` - there are no accounts, register a new one), uploaded
files and rendered videos (`storage/`), the render bundle
(`.remotion-bundle/`). The first server render downloads a headless browser.

After registering, give your own account Premium (otherwise exports are
limited to 720p / 30 fps with a watermark):

```bash
pnpm tier you@example.com PREMIUM
```

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server on port 3000 |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm test` | 22 checks of scene logic, server rules and account helpers |
| `pnpm lint` | ESLint |
| `pnpm exec tsc --noEmit` | Type check |
| `pnpm remotion:bundle` | Rebuild the render bundle - **needed after every change under `remotion/`**, or server renders show the old code |
| `pnpm thumbnails [ids]` | Re-render preview pictures of templates and elements (rebuilds the bundle) |
| `pnpm previews [ids]` | Re-render the hover loops of templates (rebuilds the bundle) |
| `pnpm tier <email> FREE\|PREMIUM` | Set an account's plan by hand |
| `pnpm cleanup [--dry-run]` | Delete files of anonymous visitors older than three days |

## Where things are

- `remotion/` - everything that draws a frame; shared by the editor
  preview and the server render, so both always look the same.
  - `scene/definitions.ts` - the scene document, every element type and its
    parameters. The sidebar is generated from this.
  - `scene/sanitize.ts` - cleans any scene from the client; never skip it.
  - `scene/bindings.ts`, `keyframes.ts`, `cameraMoves.ts`, `lyrics.ts` -
    audio bindings, keyframes and tempo swing, camera moves, timed lyrics.
  - `scene/elements*.tsx`, `gpuCloud.tsx` - the element components; dense
    point clouds are animated on the GPU through `GpuCloud`.
  - `scene/templates.ts`, `palettes.ts` - the built-in templates and colours.
  - `audio/analysis.ts` - the one-off analysis of a track (bands, beats).
  - `brand.ts` - the product name.
- `src/app/` - pages (`/`, `/editor`, `/pricing`, `/dashboard`, `/account`,
  `/login`, `/register`) and API routes (`api/`).
- `src/components/editor/` - the editor: `Sidebar`, `Preview`, `Transport`
  (timeline), `BindableSlider` (fader with audio jack and keyframes).
- `src/lib/` - server rules: `fileAccess.ts` (who may read a file),
  `tiers.ts` (plan limits), `stripe.ts` (payments), `renderQueue.ts`,
  `cleanup.ts`, `projects.ts`, `tokens.ts` and `mail.ts` (signed mail
  links), `rateLimit.ts`, `origin.ts` and `renderSettings.ts` (values that
  differ between development and a server).
- `scripts/` - the commands above. `tests/` - the automated tests.
- `prisma/` - schema and migrations (SQLite in development).

## State at handover

Everything is committed and pushed. Types, lint and tests pass.

Built in the night to 2026-11-12, newest first: server instructions and a
Dockerfile; four more elements and templates (Oscilloscope, Halo,
Fireworks, Night City); project pictures in the dashboard; preview loops
that wrap without a jump; onboarding and keyboard shortcuts; legal pages as
drafts; password reset, address confirmation and request limits.

Built before that, newest first: timeline zoom and per-setting keyframe
rows; automated tests; account page; render queue; six new elements and
templates; lyrics element; tempo on the beat; camera moves; new landing
page with a live 3D hero; hover loops for templates; the rebrand; keyframes
and tempo swing; landing and pricing pages with Stripe; plans and
watermark; video history; storage clean-up; own templates with share
links; fonts and track title; undo/redo; duplicate/reorder; portrait and
square formats; files tied to accounts; template gallery.

## Not verified - check before relying on it

- **Nothing was ever run on macOS.** The render uses Chromium with
  `gl: "angle"` (`src/app/api/render/route.ts`, `scripts/thumbnails.ts`,
  `scripts/previews.ts`). If a render fails or comes out black on the Mac,
  that option is the first thing to look at.
- **No mail was ever sent.** Password reset and address confirmation were
  tested with the links printed to the server log; sending through Resend
  needs a key and a verified sender domain.
- **`DEPLOY.md` and the `Dockerfile` were never tried.** In particular
  rendering on Linux without a graphics card (`RENDER_GL="swangle"`) is
  untested, and so is its speed.
- **Stripe was never called.** The webhook was tested with self-signed
  messages only; Checkout and the customer portal need real keys in `.env`
  (see `.env.example`) and a test run.
- **In the browser** the previous machine could only drive a hidden pane,
  where animation frames do not run. Not seen by eye: smooth playback of
  the new elements, the tempo swing in motion, dragging keyframe diamonds
  (including Alt-drag to copy), the gizmo writing keyframes, the landing
  hero leaning to the pointer, hover loops starting, the scroll reveals.
- Pictures and 3D models of a logged-in user inside a server render were
  not tested separately (the track takes the same path and works).
- The unsaved-changes warning, duplicating and reordering elements, the
  font picker and "My templates" were not clicked through in a browser.
- The fonts are open-licence (SIL OFL) according to their npm packages;
  nobody has read the licences against the planned commercial use.

## Known gaps

- No mobile layout for the editor (the owner said it is not needed yet).
- The render queue lives in one server process; two servers on the same
  database would not share it, and starting one marks the unfinished jobs
  of the other as failed.
- A shared template shows no private pictures or models to other people.
- Only `.glb` models, no Draco compression, no model animations.
- Counts and speeds cannot be keyframed or bound to audio (the picture
  would jump); everything else can.
- Thin 1-pixel lines look faint at 4K.
- The legal pages are drafts with placeholders; nothing has been checked
  by a lawyer.
- Address confirmation is asked for but not enforced: an unconfirmed
  account can do everything.
- Storage is the local disk and the database is SQLite; both are meant to
  be swapped (object storage, Postgres) before a real launch.

## Hosting

The owner hosts at helloly and asked whether a normal web hosting package
is enough for the launch. Answer given: almost certainly not - the app
needs a long-running Node process, a headless browser with FFmpeg and a
writable disk, which classic shared hosting does not offer. A virtual
server (about 4 cores, 8 GB) is the smallest thing that can run it; the
domain can stay where it is. Whether helloly sells such servers was not
checked on their own site.

## Ideas the owner liked or might want next

Trying `DEPLOY.md` on a real server and measuring render speed there, a
real name and domain, filling in the legal pages, a Stripe test run,
sending mail for real, per-element timeline tracks for bindings, and more
elements from the owner's inspiration screenshots.
