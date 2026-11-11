# Untested - written without a Docker host at hand. See DEPLOY.md.
FROM node:20-bookworm-slim

# Libraries the headless browser (used for rendering) needs on Debian, as
# listed at https://www.remotion.dev/docs/miscellaneous/linux-dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 \
    libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 \
    libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

COPY . .

# No graphics card in a container: draw in software.
ENV RENDER_GL=swangle
ENV NODE_ENV=production

# The build reads the database schema only; the real database is created
# when the container starts, in the mounted folder.
RUN pnpm remotion:bundle && pnpm build

EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start"]
