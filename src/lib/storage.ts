import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Minimal local-filesystem storage for development. In production this
 * gets swapped for Cloudflare R2 (or similar object storage) - callers only
 * ever deal with logical "keys" like "uploads/<id>.wav", never raw
 * filesystem paths, so that swap should only touch this file.
 */

const STORAGE_ROOT = path.resolve(
  process.cwd(),
  process.env.STORAGE_ROOT || "storage",
);

function resolveSafePath(key: string): string {
  const normalized = path.normalize(key).replace(/^([/\\])+/, "");
  const resolved = path.join(STORAGE_ROOT, normalized);

  if (!resolved.startsWith(STORAGE_ROOT)) {
    throw new Error(`Refusing to access path outside storage root: ${key}`);
  }

  return resolved;
}

export async function saveFile(key: string, data: Buffer): Promise<string> {
  const fullPath = resolveSafePath(key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, data);
  return key;
}

export function fileExists(key: string): boolean {
  try {
    return existsSync(resolveSafePath(key));
  } catch {
    return false;
  }
}

export function getFileSize(key: string): number {
  return statSync(resolveSafePath(key)).size;
}

export function readFileStream(key: string) {
  return createReadStream(resolveSafePath(key));
}

export function getAbsolutePath(key: string): string {
  return resolveSafePath(key);
}

export async function deleteFile(key: string): Promise<void> {
  await rm(resolveSafePath(key), { force: true });
}

/** Every file directly inside a storage folder ("uploads", "renders"). */
export async function listFiles(
  folder: string,
): Promise<{ key: string; modifiedAt: Date }[]> {
  const directory = resolveSafePath(folder);
  if (!existsSync(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      key: `${folder}/${entry.name}`,
      modifiedAt: statSync(path.join(directory, entry.name)).mtime,
    }));
}
