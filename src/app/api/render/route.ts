import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { mkdir } from "node:fs/promises";
import { getFreePort } from "@/lib/freePort";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { auth } from "@/auth";
import { createFileToken, fileOwner } from "@/lib/fileAccess";
import { fileExists, getAbsolutePath } from "@/lib/storage";
import { TIER_LIMITS, isFrameRateAllowed, isResolutionAllowed } from "@/lib/tiers";
import { getTier } from "@/lib/userTier";
import { prisma } from "@/lib/prisma";
import {
  sanitizeAspect,
  sanitizeFrameRate,
  sanitizeResolution,
} from "@/lib/visualizerSettings";
import { outputSize } from "../../../../remotion/types";
import type { SceneDocument } from "../../../../remotion/scene/definitions";
import { sanitizeScene } from "../../../../remotion/scene/sanitize";

// Pre-built by `pnpm remotion:bundle` (see scripts/bundle-remotion.ts).
// @remotion/bundler cannot run inside this route directly - see
// https://www.remotion.dev/docs/miscellaneous/nextjs
const BUNDLE_DIR = path.resolve(process.cwd(), ".remotion-bundle");
const COMPOSITION_ID = "AudioVisualizer3D";

async function runRender(
  jobId: string,
  audioSrc: string,
  appBase: string,
  scene: SceneDocument,
  resolution: { width: number; height: number },
  fps: number,
  fileToken: string | undefined,
  watermark: boolean,
) {
  const inputProps = { audioSrc, scene, appBase, fileToken, watermark };
  const chromiumOptions = { gl: "angle" as const, disableWebSecurity: true };

  try {
    await prisma.renderJob.update({
      where: { id: jobId },
      data: { status: "RENDERING" },
    });

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

    const outputKey = `renders/${jobId}.mp4`;
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
      port: await getFreePort(),
      onProgress: ({ progress }) => {
        const percent = Math.round(progress * 100);
        if (percent === lastReportedPercent) return;
        lastReportedPercent = percent;
        // Fire-and-forget: a slow DB write must never stall the renderer.
        prisma.renderJob
          .update({ where: { id: jobId }, data: { progress } })
          .catch(() => {});
      },
    });

    await prisma.renderJob.update({
      where: { id: jobId },
      data: {
        status: "DONE",
        progress: 1,
        outputPath: outputKey,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`Render job ${jobId} failed:`, error);
    await prisma.renderJob
      .update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error.",
        },
      })
      .catch(() => {});
  }
}

export async function POST(request: Request) {
  if (!fs.existsSync(BUNDLE_DIR)) {
    return NextResponse.json(
      {
        error:
          "No Remotion bundle found. Please run `pnpm remotion:bundle` once, then try again.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const audioKey = typeof body?.audioKey === "string" ? body.audioKey : null;

  if (!audioKey) {
    return NextResponse.json({ error: "audioKey is missing." }, { status: 400 });
  }

  // Clamps and allowlists everything the client sent (see sanitize.ts).
  const scene = sanitizeScene(body?.scene);
  const resolutionKey = sanitizeResolution(body?.resolution);
  const aspect = sanitizeAspect(body?.aspect);
  const resolution = outputSize(aspect, resolutionKey);
  const fps = sanitizeFrameRate(body?.fps);

  // The track must exist and must not belong to somebody else.
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const audioOwner = fileExists(audioKey) ? await fileOwner(audioKey) : null;
  if (!fileExists(audioKey) || (audioOwner && audioOwner !== userId)) {
    return NextResponse.json(
      { error: "The track was not found. Load it again." },
      { status: 404 },
    );
  }

  // The plan decides what may be exported. Checked here, whatever the
  // editor showed: the request could come from anywhere.
  const tier = await getTier(userId);
  if (!isResolutionAllowed(tier, resolutionKey) || !isFrameRateAllowed(tier, fps)) {
    return NextResponse.json(
      {
        error: `The free plan exports up to ${TIER_LIMITS.FREE.maxResolution} at ${TIER_LIMITS.FREE.frameRates.join(" or ")} fps. Upgrade to Premium for more.`,
      },
      { status: 403 },
    );
  }
  const watermark = TIER_LIMITS[tier].watermark;

  // The render browser has no login cookie. This token lets it read the
  // files of the account that started the render - and nobody else's.
  const fileToken = userId ? createFileToken(userId) : undefined;
  const tokenQuery = fileToken ? `?t=${encodeURIComponent(fileToken)}` : "";

  const origin = new URL(request.url).origin;
  // The headless render browser fetches this over plain HTTP from our own
  // Next.js server - a different origin/port than the Remotion bundle is
  // served from, hence disableWebSecurity in runRender() to avoid CORS.
  const audioSrc = `${origin}/api/files/${audioKey}${tokenQuery}`;

  const job = await prisma.renderJob.create({
    data: {
      audioKey,
      userId,
      settings: JSON.parse(JSON.stringify({ scene, resolution: resolutionKey, aspect, fps, watermark })),
      status: "QUEUED",
    },
  });

  // Deliberately not awaited: this is a long-running self-hosted Node
  // process (not serverless), so the render keeps going in the background
  // while the client polls GET /api/render/[jobId] for progress.
  void runRender(
    job.id,
    audioSrc,
    origin,
    scene,
    resolution,
    fps,
    fileToken,
    watermark,
  );

  return NextResponse.json({ jobId: job.id });
}
