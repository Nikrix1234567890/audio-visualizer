# Handover

For the agent (or person) picking this project up on another machine.
Written on 2026-11-11 and extended in the night to 2026-11-12, at the end
of a long session on a Windows PC. Continued on 2026-11-12 on a Mac
(MacBook Air, M4), where the project was set up from a fresh checkout.

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
| `pnpm test` | 29 checks of scene logic, server rules, account helpers and the render queue (the queue checks use a throw-away database) |
| `pnpm lint` | ESLint |
| `pnpm exec tsc --noEmit` | Type check |
| `pnpm remotion:bundle` | Rebuild the render bundle - **needed after every change under `remotion/`**, or server renders show the old code |
| `pnpm thumbnails [ids]` | Re-render preview pictures of templates and elements (rebuilds the bundle) |
| `pnpm previews [ids]` | Re-render the hover loops of templates (rebuilds the bundle) |
| `pnpm tier <email> FREE\|PREMIUM` | Set an account's plan by hand |
| `pnpm cleanup [--dry-run]` | Delete files of anonymous visitors older than three days |
| `pnpm measure` | Render ten seconds and print the frames per second - see the top of `scripts/measure-render.ts` for the options |
| `pnpm worker` | A render worker without the website, for a machine that only renders (see `DEPLOY.md`) |

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
  `tiers.ts` (plan limits), `stripe.ts` (payments), `renderQueue.ts`
  (the queue's bookkeeping in the database), `renderJob.ts` (draws one
  job), `renderWorker.ts` (takes one job after another; started by
  `src/instrumentation.ts` when the server starts), `cleanup.ts`, `projects.ts`, `tokens.ts` and `mail.ts` (signed mail
  links), `rateLimit.ts`, `origin.ts` and `renderSettings.ts` (values that
  differ between development and a server).
- `scripts/` - the commands above. `tests/` - the automated tests.
- `prisma/` - schema and migrations (SQLite in development).

## State at handover

Everything is committed and pushed. Types, lint, tests and a production
build pass.

Built on 2026-11-12 on the Mac: `pnpm measure`; the render queue in the
database, with `pnpm worker`; exporting a section of the track.

Render speed measured with `pnpm measure` (ten seconds, 30 fps, MacBook
Air M4, 10 threads), in frames per second:

| | 1080p | 720p |
| --- | --- | --- |
| Graphics card (`angle`) | about 63 | not measured |
| Software (`swangle`) | about 5 | about 12 |

So a three-minute song at 1080p / 30 fps takes about a minute and a half
with the graphics card and 16 to 18 minutes in software. Radial Bars and
Galaxy were equally fast, and `RENDER_CONCURRENCY=4` changed nothing in
software. This is a Mac: it says that software drawing costs roughly a
factor of twelve, not what the old i7 or a rented server will do - run
`pnpm measure` there.

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

- **macOS:** setup, the development server, tests, a production build and
  server renders (720p through the app, 1080p through `pnpm measure`) ran
  on the Mac. Nobody looked at a rendered video by eye there; length, size
  and sound were checked with tools. `pnpm thumbnails` and `pnpm previews`
  were not run. The Mac has pnpm 10, which skips the build scripts of
  prisma, esbuild and sharp; nothing failed because of it so far.
- **The queue with two workers** was only checked by the automated tests
  (several claims at once against one database), never with two real
  processes or machines. Surviving a restart was tried for real: the
  waiting render continued at once, the interrupted one a minute later.
- **The section export** was clicked through once in the editor (buttons,
  dragging an edge, a render). Not tried: with the timeline zoomed in, on
  a long track, the arrow keys on an edge.
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
- The picture of a saved project (dashboard) is drawn by the process that
  saved it and is not a job in the queue; a restart at that moment loses
  the picture until the project is saved again.
- A render that fails (as opposed to one that is interrupted) is not
  tried again.
- The chosen export section is not saved with the project.
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

The owner also has small former CI worker machines (an old i7, 16 GB
memory, no separate graphics card) and asked whether one can be the server.
Answer given: yes, and the likely plan for the start. An old i7 usually has
built-in Intel graphics the render browser may be able to use, which a
rented virtual server lacks - untested. The hurdle is the home connection,
not the machine: put it behind a Cloudflare Tunnel (no open ports, HTTPS
included, the domain must run through Cloudflare), mind the upload speed
(every video goes out through it), back up the database and `storage/`
elsewhere, and check that the internet contract allows it. A rented
alternative is a virtual server with 4 cores and 8 GB; cheap plans share
their cores and throttle under render load. Prices were not looked up.

Note for clarity: only the editor preview runs in the visitor's browser.
The final MP4 is rendered on the server (`src/app/api/render/route.ts`).

## Next steps

Proposed to the owner on 2026-11-12. The owner picked 1, 2 and 10, which
are done. **The others are not started and not picked** - ask before
starting.

Before moving to the mini machine:

1. ~~Measure software rendering locally.~~ Done on 2026-11-12, numbers
   under "State at handover". (On the Windows PC, with a graphics card,
   1080p ran at about 33 frames per second.) Still to do: the same
   measurement on the machine that will be the server.
2. ~~Move the render queue into the database.~~ Done on 2026-11-12.
3. **A backup command.** `pnpm backup` that packs the database and
   `storage/` into a dated archive.
4. **A status page for the owner.** Accounts, running and failed renders,
   disk use; plus a health address for monitoring.
5. **Build and start the Docker image once**, to find out whether the
   `Dockerfile` works at all.

Money and accounts:

6. **Run Stripe in test mode end to end** - purchase, cancellation,
   webhook. Needs test keys from the owner.
7. **Send one real mail.** Needs a Resend key and a sender domain.
8. **Enforce address confirmation**, e.g. renders only for confirmed
   accounts, against throwaway accounts.

Product:

9. **Prototype rendering in the visitor's browser.** Would take the render
   load off the server. Open: whether Remotion's in-browser rendering works
   with the 3D scenes and the sound, and how to keep the free-plan limits
   and watermark, which the server enforces today.
10. ~~Export a section instead of the whole song.~~ Done on 2026-11-12.
11. **A mail when the video is ready**, and a remaining-time display while
    it renders.
12. **More elements** from the owner's inspiration screenshots.

Also still open from before: a real name and domain, filling in the legal
pages, and per-element timeline tracks for bindings.

## Redesign (started 2026-11-12)

A new look for the landing page and the editor has been designed but not
built. Everything about it - links to the two preview pages, the sources,
the open decisions and the build order - is in `design/README.md`.
