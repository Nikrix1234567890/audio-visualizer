import fs from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { createFileToken } from "@/lib/fileAccess";
import { getFreePort } from "@/lib/freePort";
import { HEARTBEAT_MS, markJobDone, markJobFailed, reportAlive } from "@/lib/renderQueue";
import { renderConcurrency, renderGl } from "@/lib/renderSettings";
import { getAbsolutePath } from "@/lib/storage";
import {
  frameRangeFor,
  sanitizeAspect,
  sanitizeFrameRate,
  sanitizeRange,
  sanitizeResolution,
} from "@/lib/visualizerSettings";
import { outputSize } from "../../remotion/types";
import { sanitizeScene } from "../../remotion/scene/sanitize";

// Draws one job from the queue into an MP4. Everything it needs is in the
// job's row, so it can run in any process that sees the database and the
// storage: the web server itself or a separate worker (scripts/render-worker.ts).

// Pre-built by `pnpm remotion:bundle` (see scripts/bundle-remotion.ts).
// @remotion/bundler cannot run inside the Next.js server - see
// https://www.remotion.dev/docs/miscellaneous/nextjs
export const BUNDLE_DIR = path.resolve(process.cwd(), ".remotion-bundle");
const COMPOSITION_ID = "AudioVisualizer3D";

export function hasRenderBundle(): boolean {
  return fs.existsSync(BUNDLE_DIR);
}

type ClaimedJob = {
  id: string;
  userId: string | null;
  audioKey: string;
  settings: unknown;
  appOrigin: string | null;
};

/** Renders a job this worker has claimed and records how it ended. */
export async function runRenderJob(job: ClaimedJob, workerId: string) {
  // A timer rather than the progress callback: analysing the track and
  // encoding the sound report no progress, and must not look like a dead
  // worker.
  const heartbeat = setInterval(() => {
    reportAlive(job.id, workerId).catch(() => {});
  }, HEARTBEAT_MS);

  try {
    const outputKey = await render(job, workerId);
    await markJobDone(job.id, workerId, outputKey);
  } catch (error) {
    console.error(`Render job ${job.id} failed:`, error);
    await markJobFailed(
      job.id,
      workerId,
      error instanceof Error ? error.message : "Unknown error.",
    ).catch(() => {});
  } finally {
    clearInterval(heartbeat);
  }
}

async function render(job: ClaimedJob, workerId: string): Promise<string> {
  // Sanitized when the job was created; again here, because this is where
  // the values are used and the row may be older than the current rules.
  const settings = (job.settings ?? {}) as Record<string, unknown>;
  const scene = sanitizeScene(settings.scene);
  const resolution = outputSize(
    sanitizeAspect(settings.aspect),
    sanitizeResolution(settings.resolution),
  );
  const fps = sanitizeFrameRate(settings.fps);
  const range = sanitizeRange(settings.range);
  // Only an explicit false removes the mark: a row that lacks the field
  // must not turn into a free unmarked video.
  const watermark = settings.watermark !== false;

  const appBase = (process.env.INTERNAL_URL?.trim() || job.appOrigin || "").replace(/\/+$/, "");
  if (!appBase) {
    throw new Error("The address of the app is unknown. Set INTERNAL_URL.");
  }
  // The render browser has no login cookie. This token lets it read the
  // files of the account that started the render - and nobody else's.
  const fileToken = job.userId ? createFileToken(job.userId) : undefined;
  const tokenQuery = fileToken ? `?t=${encodeURIComponent(fileToken)}` : "";
  // Fetched over plain HTTP from the app - a different origin/port than the
  // Remotion bundle is served from, hence disableWebSecurity (no CORS).
  const audioSrc = `${appBase}/api/files/${job.audioKey}${tokenQuery}`;

  const inputProps = { audioSrc, scene, appBase, fileToken, watermark };
  const chromiumOptions = { gl: renderGl(), disableWebSecurity: true };

  const composition = await selectComposition({
    serveUrl: BUNDLE_DIR,
    id: COMPOSITION_ID,
    inputProps,
    chromiumOptions,
    port: await getFreePort(),
  });

  // Override the default 720p landscape size of the composition with the
  // chosen format and resolution. The camera adapts to the shape of the
  // picture by itself (see verticalFov in remotion/scene/camera.ts).
  composition.width = resolution.width;
  composition.height = resolution.height;

  // And its frame rate with the chosen one. The scene is a function of
  // time, not of frame numbers, so this only changes how often the same
  // motion is sampled.
  const seconds = composition.durationInFrames / composition.fps;
  composition.fps = fps;
  composition.durationInFrames = Math.max(1, Math.floor(seconds * fps));

  // A section keeps its place in the song: frame numbers, and with them
  // the motion and the sound, are those of the whole track.
  const frameRange = range
    ? frameRangeFor(range, fps, composition.durationInFrames)
    : undefined;
  if (frameRange === null) {
    throw new Error("The chosen section starts after the end of the track.");
  }

  const outputKey = `renders/${job.id}.mp4`;
  const outputPath = getAbsolutePath(outputKey);
  await mkdir(path.dirname(outputPath), { recursive: true });

  let lastReportedPercent = -1;

  await renderMedia({
    composition,
    serveUrl: BUNDLE_DIR,
    codec: "h264",
    outputLocation: outputPath,
    inputProps,
    chromiumOptions,
    concurrency: renderConcurrency(),
    frameRange,
    port: await getFreePort(),
    onProgress: ({ progress }) => {
      const percent = Math.round(progress * 100);
      if (percent === lastReportedPercent) return;
      lastReportedPercent = percent;
      // Fire-and-forget: a slow DB write must never stall the renderer.
      reportAlive(job.id, workerId, progress).catch(() => {});
    },
  });

  return outputKey;
}
