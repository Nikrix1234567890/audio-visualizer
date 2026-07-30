import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma's CLI (migrate/generate) resolves a relative sqlite `file:` URL
// relative to prisma/schema.prisma, but the generated client resolves it
// relative to process.cwd() at runtime - these can differ depending on how
// Next.js invokes route handlers. To avoid the classic "Unable to open the
// database file" footgun, we resolve it to an absolute path ourselves,
// consistently anchored at <project root>/prisma/.
function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!raw.startsWith("file:")) {
    return raw;
  }
  const relativePath = raw.slice("file:".length);
  const absolutePath = path.resolve(process.cwd(), "prisma", relativePath);
  return `file:${absolutePath}`;
}

// Standard Next.js dev-mode singleton pattern: avoids exhausting database
// connections / re-instantiating the client on every hot-reload.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ datasourceUrl: resolveDatabaseUrl() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
