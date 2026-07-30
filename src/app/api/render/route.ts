import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { mkdir } from "node:fs/promises";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { getAbsolutePath } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { sanitizeSettings } from "@/lib/visualizerSettings";
import type { VisualizerSettings } from "../../../../remotion/types";

// Pre-built by `pnpm remotion:bundle` (see scripts/bundle-remotion.ts).
// @remotion/bundler cannot run inside this route directly - see
// https://www.remotion.dev/docs/miscellaneous/nextjs
const BUNDLE_DIR = path.resolve(process.cwd(), ".remotion-bundle");
const COMPOSITION_ID = "AudioVisualizer3D";

async function runRender(
  jobId: string,
  audioSrc: string,
  settings: VisualizerSettings,
) {
  const inputProps = { audioSrc, ...settings };
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
    });

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
            error instanceof Error ? error.message : "Unbekannter Fehler.",
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
          "Kein Remotion-Bundle gefunden. Bitte einmal `pnpm remotion:bundle` ausführen und danach erneut versuchen.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const audioKey = typeof body?.audioKey === "string" ? body.audioKey : null;

  if (!audioKey) {
    return NextResponse.json({ error: "audioKey fehlt." }, { status: 400 });
  }

  const settings = sanitizeSettings(body?.settings);
  const origin = new URL(request.url).origin;
  // The headless render browser fetches this over plain HTTP from our own
  // Next.js server - a different origin/port than the Remotion bundle is
  // served from, hence disableWebSecurity in runRender() to avoid CORS.
  const audioSrc = `${origin}/api/files/${audioKey}`;

  const job = await prisma.renderJob.create({
    data: { audioKey, settings, status: "QUEUED" },
  });

  // Deliberately not awaited: this is a long-running self-hosted Node
  // process (not serverless), so the render keeps going in the background
  // while the client polls GET /api/render/[jobId] for progress.
  void runRender(job.id, audioSrc, settings);

  return NextResponse.json({ jobId: job.id });
}
