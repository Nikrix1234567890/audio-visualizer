import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  ELEMENT_DEFS,
  type SceneDocument,
} from "../../remotion/scene/definitions";

// Who may read a stored file.
//
// A file uploaded or rendered while logged in belongs to that account and
// is only handed to it. A file from an anonymous visitor has no owner; it
// stays reachable by its random, unguessable address, because there is no
// identity to tie it to.
//
// One reader has no login cookie: the headless browser that draws a server
// render. It fetches the track and the scene's pictures and models over
// HTTP like any visitor. The render route therefore gives it a short-lived
// signed token that stands in for the account that started the render.

const TOKEN_LIFETIME_MS = 6 * 60 * 60 * 1000;
const RENDER_KEY = /^renders\/([a-z0-9]+)\.mp4$/;
const THUMB_KEY = /^thumbs\/([a-z0-9]+)\.jpg$/;

function sign(userId: string, expires: number): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set.");
  return createHmac("sha256", secret)
    .update(`files:${userId}:${expires}`)
    .digest("base64url");
}

/** A token that lets its bearer read `userId`'s files for a few hours. */
export function createFileToken(userId: string): string {
  const expires = Date.now() + TOKEN_LIFETIME_MS;
  return `${userId}.${expires}.${sign(userId, expires)}`;
}

/** The account a token stands in for, or null if it is invalid or expired. */
function tokenUserId(token: string | null): string | null {
  if (!token) return null;
  const [userId, expiresText, signature] = token.split(".");
  const expires = Number(expiresText);
  if (!userId || !signature || !Number.isFinite(expires) || expires < Date.now()) {
    return null;
  }
  const expected = Buffer.from(sign(userId, expires));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }
  return userId;
}

/** The account a stored file belongs to, or null if it has no owner. */
export async function fileOwner(key: string): Promise<string | null> {
  const render = RENDER_KEY.exec(key);
  if (render) {
    const job = await prisma.renderJob.findUnique({
      where: { id: render[1] },
      select: { userId: true },
    });
    return job?.userId ?? null;
  }
  // The picture of a project belongs to whoever owns the project.
  const thumb = THUMB_KEY.exec(key);
  if (thumb) {
    const project = await prisma.project.findUnique({
      where: { id: thumb[1] },
      select: { userId: true },
    });
    // No such project: nobody may read a leftover picture.
    return project?.userId ?? "nobody";
  }
  const upload = await prisma.upload.findUnique({
    where: { key },
    select: { userId: true },
  });
  return upload?.userId ?? null;
}

/**
 * Whether a file may be handed out. `userId` reads the signed-in account
 * lazily: most requests concern ownerless files and never need it.
 */
export async function canReadFile(
  key: string,
  userId: () => Promise<string | null>,
  token: string | null,
): Promise<boolean> {
  const owner = await fileOwner(key);
  if (!owner) return true;
  if (tokenUserId(token) === owner) return true;
  return (await userId()) === owner;
}

/** Storage keys of every picture and 3D model a scene uses. */
export function sceneAssetKeys(scene: SceneDocument): string[] {
  const keys: string[] = [];
  for (const element of scene.elements) {
    for (const def of ELEMENT_DEFS[element.type].params) {
      if (def.kind !== "image" && def.kind !== "model") continue;
      const value = element.params[def.key];
      if (typeof value === "string" && value) keys.push(value);
    }
  }
  return keys;
}

/**
 * Hands ownerless files to an account - used when a project is saved, so
 * that a track or picture uploaded just before logging in becomes private
 * along with the project. Files that already belong to someone are left
 * alone.
 */
export async function claimFiles(keys: string[], userId: string) {
  if (keys.length === 0) return;
  await prisma.upload.updateMany({
    where: { key: { in: keys }, userId: null },
    data: { userId },
  });
}
