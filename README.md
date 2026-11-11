# Pulsefield

Turn a song into an audio-reactive 3D video, in the browser. Build a scene
from elements, wire it to the music, animate it over time and render an MP4.

"Pulsefield" is a working title.

- **Picking this project up?** Start with [HANDOVER.md](HANDOVER.md): setup,
  commands, where things are, what is and is not verified.
- What the product does: [PRODUCT.md](PRODUCT.md)
- How it looks and why: [DESIGN.md](DESIGN.md)
- Rules for coding agents: [AGENTS.md](AGENTS.md)

## Quick start

```bash
pnpm install
cp .env.example .env   # then set AUTH_SECRET, see the file
pnpm exec prisma migrate deploy
pnpm remotion:bundle
pnpm dev
```

Built with Next.js 16, React 19, Remotion, React Three Fiber, Prisma and
Auth.js.
