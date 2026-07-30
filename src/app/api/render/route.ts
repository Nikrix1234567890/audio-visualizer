import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { getAbsolutePath } from "@/lib/storage";
import {
  DEFAULT_VISUALIZER_SETTINGS,
  type VisualizerSettings,
} from "../../../../remotion/types";

// Pre-built by `pnpm remotion:bundle` (see scripts/bundle-remotion.ts).
// @remotion/bundler cannot run inside this route directly - see
// https://www.remotion.dev/docs/miscellaneous/nextjs
const BUNDLE_DIR = path.resolve(process.cwd(), ".remotion-bundle");
const COMPOSITION_ID = "AudioVisualizer3D";
const ALLOWED_BAR_COUNTS = [16, 32, 64, 128];

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeSettings(input: unknown): VisualizerSettings {
  const raw = (input ?? {}) as Partial<VisualizerSettings>;
  const barCount = ALLOWED_BAR_COUNTS.includes(raw.barCount as number)
    ? (raw.barCount as number)
    : DEFAULT_VISUALIZER_SETTINGS.barCount;

  return {
    barCount,
    radius: clampNumber(raw.radius, DEFAULT_VISUALIZER_SETTINGS.radius, 1, 10),
    barWidth: clampNumber(
      raw.barWidth,
      DEFAULT_VISUALIZER_SETTINGS.barWidth,
      0.05,
      1,
    ),
    heightScale: clampNumber(
      raw.heightScale,
      DEFAULT_VISUALIZER_SETTINGS.heightScale,
      1,
      10,
    ),
    hueStart: clampNumber(
      raw.hueStart,
      DEFAULT_VISUALIZER_SETTINGS.hueStart,
      0,
      360,
    ),
    hueEnd: clampNumber(raw.hueEnd, DEFAULT_VISUALIZER_SETTINGS.hueEnd, 0, 720),
    cameraSpeed: clampNumber(
      raw.cameraSpeed,
      DEFAULT_VISUALIZER_SETTINGS.cameraSpeed,
      0,
      2,
    ),
  };
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
  // served from, hence disableWebSecurity below to avoid CORS friction.
  const audioSrc = `${origin}/api/files/${audioKey}`;

  const inputProps = { audioSrc, ...settings };
  const chromiumOptions = {
    gl: "angle" as const,
    disableWebSecurity: true,
  };

  try {
    const composition = await selectComposition({
      serveUrl: BUNDLE_DIR,
      id: COMPOSITION_ID,
      inputProps,
      chromiumOptions,
    });

    const id = randomUUID();
    const outputKey = `renders/${id}.mp4`;
    const outputPath = getAbsolutePath(outputKey);
    await mkdir(path.dirname(outputPath), { recursive: true });

    await renderMedia({
      composition,
      serveUrl: BUNDLE_DIR,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
      chromiumOptions,
    });

    return NextResponse.json({ url: `/api/files/${outputKey}` });
  } catch (error) {
    console.error("Render failed:", error);
    return NextResponse.json(
      { error: "Rendern fehlgeschlagen. Siehe Server-Logs für Details." },
      { status: 500 },
    );
  }
}
