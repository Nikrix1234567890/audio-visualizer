import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fileOwner } from "@/lib/fileAccess";
import { internalOrigin } from "@/lib/origin";
import { prisma } from "@/lib/prisma";
import { HOUR, clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { hasRenderBundle } from "@/lib/renderJob";
import { queueRefusal } from "@/lib/renderQueue";
import { startRenderWorker } from "@/lib/renderWorker";
import { fileExists } from "@/lib/storage";
import { TIER_LIMITS, isFrameRateAllowed, isResolutionAllowed } from "@/lib/tiers";
import { getTier } from "@/lib/userTier";
import {
  sanitizeAspect,
  sanitizeFrameRate,
  sanitizeRange,
  sanitizeResolution,
} from "@/lib/visualizerSettings";
import { sanitizeScene } from "../../../../remotion/scene/sanitize";

export async function POST(request: Request) {
  if (!rateLimit(`render:${clientIp(request)}`, 30, HOUR)) {
    return tooManyRequests("renders");
  }

  if (!hasRenderBundle()) {
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
  const fps = sanitizeFrameRate(body?.fps);
  // A part of the track, or null for all of it.
  const range = sanitizeRange(body?.range);

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

  const refusal = await queueRefusal(userId);
  if (refusal) {
    return NextResponse.json({ error: refusal }, { status: 429 });
  }

  // Everything the render needs goes into the row: the queue is the
  // database, and whichever worker takes the job reads it from there
  // (see src/lib/renderQueue.ts and renderJob.ts).
  const job = await prisma.renderJob.create({
    data: {
      audioKey,
      userId,
      settings: JSON.parse(
        JSON.stringify({ scene, resolution: resolutionKey, aspect, fps, watermark, range }),
      ),
      appOrigin: internalOrigin(request),
      status: "QUEUED",
    },
  });

  // Not awaited: this is a long-running self-hosted Node process (not
  // serverless), so the render happens in the background - after the ones
  // queued before it - while the client polls GET /api/render/[jobId].
  startRenderWorker();

  return NextResponse.json({ jobId: job.id });
}
