import { prisma } from "@/lib/prisma";
import { sceneAssetKeys } from "@/lib/fileAccess";
import { deleteFile, listFiles } from "@/lib/storage";
import { sanitizeScene } from "../../remotion/scene/sanitize";

// Keeps the storage folder from growing without end.
//
// Removed: files nobody can get back to anyway - tracks, pictures and
// models uploaded without an account, and videos rendered without one,
// once they are a few days old.
// Kept: everything that belongs to an account, and every file a saved
// project or saved template still uses, however old.

/** Files of anonymous visitors are kept this long. */
export const ANONYMOUS_FILE_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
/** How often the automatic clean-up may run. */
const AUTO_INTERVAL_MS = 6 * 60 * 60 * 1000;

export type CleanupReport = { uploads: string[]; renders: string[] };

/** Storage keys that saved projects and saved templates still point at. */
async function referencedKeys(): Promise<Set<string>> {
  const keys = new Set<string>();
  const projects = await prisma.project.findMany({
    select: { audioPath: true, settings: true },
  });
  for (const project of projects) {
    keys.add(project.audioPath);
    const scene = (project.settings as { scene?: unknown } | null)?.scene;
    for (const key of sceneAssetKeys(sanitizeScene(scene))) keys.add(key);
  }
  const saved = await prisma.savedScene.findMany({ select: { scene: true } });
  for (const { scene } of saved) {
    for (const key of sceneAssetKeys(sanitizeScene(scene))) keys.add(key);
  }
  return keys;
}

/**
 * Deletes old files that belong to nobody. With `dryRun` nothing is
 * deleted; the report lists what would be.
 */
export async function cleanUpStorage({
  dryRun = false,
  now = Date.now(),
}: { dryRun?: boolean; now?: number } = {}): Promise<CleanupReport> {
  const cutoff = new Date(now - ANONYMOUS_FILE_DAYS * DAY_MS);
  const referenced = await referencedKeys();
  const report: CleanupReport = { uploads: [], renders: [] };

  // --- uploads
  const uploadRows = await prisma.upload.findMany({
    select: { key: true, userId: true, createdAt: true },
  });
  const rowByKey = new Map(uploadRows.map((row) => [row.key, row]));
  for (const file of await listFiles("uploads")) {
    if (referenced.has(file.key)) continue;
    const row = rowByKey.get(file.key);
    // No row: a file from before uploads were recorded - ownerless too.
    if (row?.userId) continue;
    if ((row?.createdAt ?? file.modifiedAt) >= cutoff) continue;
    report.uploads.push(file.key);
  }
  // Rows whose file is already gone.
  const staleRows = uploadRows.filter(
    (row) => !row.userId && row.createdAt < cutoff && !referenced.has(row.key),
  );

  // --- renders
  const jobs = await prisma.renderJob.findMany({
    select: { id: true, userId: true, createdAt: true },
  });
  const jobById = new Map(jobs.map((job) => [job.id, job]));
  for (const file of await listFiles("renders")) {
    const id = file.key.slice("renders/".length).replace(/\.mp4$/, "");
    const job = jobById.get(id);
    if (job?.userId) continue;
    if ((job?.createdAt ?? file.modifiedAt) >= cutoff) continue;
    report.renders.push(file.key);
  }
  const staleJobs = jobs.filter((job) => !job.userId && job.createdAt < cutoff);

  if (dryRun) return report;

  for (const key of [...report.uploads, ...report.renders]) await deleteFile(key);
  await prisma.upload.deleteMany({
    where: { key: { in: staleRows.map((row) => row.key) } },
  });
  await prisma.renderJob.deleteMany({
    where: { id: { in: staleJobs.map((job) => job.id) } },
  });
  return report;
}

let lastAutoRun = 0;

/**
 * Runs the clean-up in the background, at most every few hours. Called
 * from the upload route, so storage is tidied whenever it is being filled -
 * no separate timer or cron job needed.
 */
export function cleanUpStorageSometimes() {
  const now = Date.now();
  if (now - lastAutoRun < AUTO_INTERVAL_MS) return;
  lastAutoRun = now;
  cleanUpStorage({ now }).catch((error) => {
    console.error("Storage clean-up failed:", error);
  });
}
