import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { getAbsolutePath } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { sanitizeResolution } from "@/lib/visualizerSettings";
import { RESOLUTIONS } from "../../../../remotion/types";
import type { SceneDocument } from "../../../../remotion/scene/definitions";
import { sanitizeScene } from "../../../../remotion/scene/sanitize";

// Pre-built by `pnpm remotion:bundle` (see scripts/bundle-remotion.ts).
// @remotion/bundler cannot run inside this route directly - see
// https://www.remotion.dev/docs/miscellaneous/nextjs
const BUNDLE_DIR = path.resolve(process.cwd(), ".remotion-bundle");
const COMPOSITION_ID = "AudioVisualizer3D";

/**
 * Asks the OS for a free TCP port. Remotion serves the bundle from its own
 * small HTTP server and by default starts looking at port 3000 - the same
 * port this Next.js app usually runs on. On Windows both can end up bound to
 * 3000, and the render browser then loads the Next.js app instead of the
 * Remotion bundle. Handing Remotion an explicit free port avoids that.
 */
function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function runRender(
  jobId: string,
  audioSrc: string,
  assetBase: string,
  scene: SceneDocument,
  resolution: { width: number; height: number },
) {
  const inputProps = { audioSrc, scene, assetBase };
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

    // Override the composition's default 720p dimensions with the
    // user-selected export resolution (aspect ratio stays 16:9 across all
    // presets, so this never affects framing - only output pixel density).
    composition.width = resolution.width;
    composition.height = resolution.height;

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
  const resolution = RESOLUTIONS[resolutionKey];

  const origin = new URL(request.url).origin;
  // The headless render browser fetches this over plain HTTP from our own
  // Next.js server - a different origin/port than the Remotion bundle is
  // served from, hence disableWebSecurity in runRender() to avoid CORS.
  const assetBase = `${origin}/api/files/`;
  const audioSrc = `${assetBase}${audioKey}`;

  const job = await prisma.renderJob.create({
    data: {
      audioKey,
      settings: JSON.parse(JSON.stringify({ scene, resolution: resolutionKey })),
      status: "QUEUED",
    },
  });

  // Deliberately not awaited: this is a long-running self-hosted Node
  // process (not serverless), so the render keeps going in the background
  // while the client polls GET /api/render/[jobId] for progress.
  void runRender(job.id, audioSrc, assetBase, scene, resolution);

  return NextResponse.json({ jobId: job.id });
}
