# Putting it on a server

How to run Pulsefield on one Linux server for a launch. **Nothing in this
file has been tried on a real server yet** - it was written on a Windows
development machine. Treat it as a checklist to work through and correct.

## What kind of server

The app is a long-running Node.js process that also renders videos with a
headless browser and FFmpeg. That rules out classic shared web hosting
(PHP/WordPress packages): it needs a machine where you can install software
and keep a process running - a virtual server (vServer/VPS) or a dedicated
one.

- **Minimum to try it:** 4 processor cores, 8 GB memory, 40 GB disk.
- **Operating system:** a current Ubuntu or Debian.
- **Graphics card:** not required, but it decides how fast renders are. On
  a desktop with a graphics card a 1080p video renders faster than it
  plays. On a server without one the picture is drawn in software, which is
  many times slower - how much slower on a given server has to be measured.
  If renders are too slow, the options are a server with a GPU, or a
  smaller free-plan resolution.

One server is enough for a launch: the database is a single SQLite file and
uploads and videos are files on the disk. Both can be moved later (see the
end of this file).

## Steps

1. **Install Node.js 20 or newer and pnpm 9**, plus the libraries the
   headless browser needs. Remotion lists them for each distribution at
   https://www.remotion.dev/docs/miscellaneous/linux-dependencies

2. **Get the code** and install:

   ```bash
   git clone https://github.com/Nikrix1234567890/audio-visualizer.git pulsefield
   cd pulsefield
   pnpm install
   ```

3. **Create `.env`** from `.env.example` and set at least:

   - `AUTH_SECRET` - a new random secret (the command is in the file).
     Never reuse the development one.
   - `APP_URL="https://your-domain.com"` and
     `INTERNAL_URL="http://localhost:3000"` - so links in mails point at
     the public site while the render browser talks to the app directly.
   - `RENDER_GL="swangle"` - on a server without a graphics card.
   - `RESEND_API_KEY` and `MAIL_FROM` - or password-reset mails only show
     up in the server log.
   - the four Stripe values - once Premium is to be sold.

4. **Create the database, the render bundle and the build:**

   ```bash
   pnpm exec prisma migrate deploy
   pnpm remotion:bundle
   pnpm build
   ```

5. **Run it** and keep it running. With systemd, as
   `/etc/systemd/system/pulsefield.service`:

   ```ini
   [Unit]
   Description=Pulsefield
   After=network.target

   [Service]
   WorkingDirectory=/home/app/pulsefield
   ExecStart=/usr/bin/env pnpm start
   Restart=always
   User=app
   Environment=NODE_ENV=production
   Environment=PORT=3000

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl enable --now pulsefield
   ```

6. **Put a web server in front of it for HTTPS.** With Caddy the whole
   configuration (`/etc/caddy/Caddyfile`) is:

   ```
   your-domain.com {
       reverse_proxy localhost:3000
   }
   ```

   Caddy fetches the certificate itself and sets the `X-Forwarded-For`
   header from the real connection. That matters: the app trusts the host
   name it is called with (`trustHost` in `src/auth.config.ts`) and limits
   requests per visitor by that header (`src/lib/rateLimit.ts`). **Do not
   expose port 3000 to the internet directly**, or visitors could fake
   both.

7. **Point the domain** at the server's address (an A record at the domain
   provider). The domain can stay wherever it is registered.

8. **Make yourself Premium** after registering on the live site:

   ```bash
   pnpm tier you@example.com PREMIUM
   ```

## Updating

```bash
git pull
pnpm install
pnpm exec prisma migrate deploy
pnpm remotion:bundle
pnpm build
sudo systemctl restart pulsefield
```

The render queue is in the database, so a restart loses no video: renders
that were waiting continue right away, and the one that was being drawn
starts over about a minute later (a job is started twice at most).

## Backups

Two things hold everything users have: the database file `prisma/dev.db`
and the folder `storage/`. Copy both somewhere else regularly. `.env` holds
the secrets and should be kept safe too.

## Before taking money

- Fill in and have checked: `/legal/imprint`, `/legal/privacy`,
  `/legal/terms` (they are marked as drafts).
- Set up Stripe with test keys first and run one purchase and one
  cancellation end to end; the code has only been tested with self-signed
  webhook messages.
- Decide on a real name - "Pulsefield" is a working title
  (`remotion/brand.ts`).

## When it grows

- **Database:** change `provider` in `prisma/schema.prisma` to
  `postgresql`, point `DATABASE_URL` at the database and recreate the
  migrations. The code itself does not depend on SQLite.
- **Files:** all reading and writing goes through `src/lib/storage.ts`;
  swapping the disk for object storage (S3, R2) means rewriting that one
  file.
- **Several servers:** the request limits (`src/lib/rateLimit.ts`) live in
  one process's memory and would need a shared store. The render queue is
  already shared: it is the database (`src/lib/renderQueue.ts`).
- **Render workers:** `pnpm worker` on another machine takes jobs from the
  same queue without serving the website. It needs the same database and
  the same storage folder as the web server (today both are local files,
  so this only works once they are swapped or shared), the render bundle,
  the same `AUTH_SECRET`, and `INTERNAL_URL` set to where it reaches the
  app. Set `RENDER_WORKER="off"` on the web server if it should not render
  itself. Tried on one machine only, never across two.

## With Docker instead

`Dockerfile` in the repository builds an image with everything installed.
It is untested. The database and the files must live outside the container:

```bash
docker build -t pulsefield .
docker run -d --name pulsefield -p 127.0.0.1:3000:3000 --env-file .env \
  -v pulsefield-db:/app/prisma/data -v pulsefield-storage:/app/storage pulsefield
```

With this layout set `DATABASE_URL="file:./data/prod.db"` in `.env`, so the
database file sits in the mounted folder.
