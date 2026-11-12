import { prisma } from "@/lib/prisma";

// The render queue lives in the database: every RenderJob row with the
// status QUEUED is waiting. That way the queue survives a restart of the
// server, and several workers (processes or machines that share the
// database and the storage) can take jobs from it.
//
// A worker takes a job by claiming it - one conditional write that only one
// worker can win - and keeps its heartbeat fresh while drawing. A job whose
// worker went silent (crashed, restarted, lost power) is handed out again,
// and given up on after MAX_ATTEMPTS starts.
//
// This file is only the bookkeeping. Drawing is in renderJob.ts, the loop
// that takes one job after another in renderWorker.ts.

/** Most renders that may wait at once, over all users. */
export const MAX_WAITING = 20;
/** Most unfinished renders one account may have. */
export const MAX_PER_USER = 3;
/** A worker reports that it is alive this often while it draws. */
export const HEARTBEAT_MS = 15_000;
/** A rendering job without a heartbeat for this long counts as abandoned. */
export const ABANDONED_AFTER_MS = 60_000;
/** A job is started at most this often before it is marked failed. */
export const MAX_ATTEMPTS = 2;

const UNFINISHED = ["QUEUED", "RENDERING"] as const;

/**
 * Why a new render cannot be accepted right now, or null if it can. Call
 * before creating the job.
 */
export async function queueRefusal(userId: string | null): Promise<string | null> {
  const waiting = await prisma.renderJob.count({
    where: { status: { in: [...UNFINISHED] } },
  });
  if (waiting >= MAX_WAITING) {
    return "Too many videos are waiting to be rendered right now. Try again in a few minutes.";
  }
  if (userId) {
    const own = await prisma.renderJob.count({
      where: { userId, status: { in: [...UNFINISHED] } },
    });
    if (own >= MAX_PER_USER) {
      return `You already have ${MAX_PER_USER} videos rendering or waiting. Wait for one to finish.`;
    }
  }
  return null;
}

/** How many renders are ahead of this job (0 = it is next or running). */
export async function queuePosition(job: {
  status: string;
  createdAt: Date;
}): Promise<number> {
  if (job.status !== "QUEUED") return 0;
  return prisma.renderJob.count({
    where: {
      status: { in: [...UNFINISHED] },
      createdAt: { lt: job.createdAt },
    },
  });
}

/**
 * Puts jobs whose worker went silent back into the queue, at their old
 * place (the queue is ordered by creation time). A job that was already
 * started MAX_ATTEMPTS times is marked failed instead: it probably takes
 * its worker down with it.
 */
export async function releaseAbandonedJobs(now = Date.now()): Promise<void> {
  const silentSince = new Date(now - ABANDONED_AFTER_MS);
  const abandoned = {
    status: "RENDERING" as const,
    OR: [{ heartbeatAt: null }, { heartbeatAt: { lt: silentSince } }],
  };
  await prisma.renderJob.updateMany({
    where: { ...abandoned, attempts: { gte: MAX_ATTEMPTS } },
    data: {
      status: "FAILED",
      workerId: null,
      errorMessage: "This video could not be finished. Render it again.",
    },
  });
  await prisma.renderJob.updateMany({
    where: abandoned,
    data: { status: "QUEUED", workerId: null, progress: 0 },
  });
}

/**
 * Takes the oldest waiting job for `workerId`, or returns null if nothing
 * is waiting. Safe with several workers: the claim is a single conditional
 * write, so each job goes to exactly one of them.
 */
export async function claimNextJob(workerId: string, now = Date.now()) {
  await releaseAbandonedJobs(now);
  for (;;) {
    const next = await prisma.renderJob.findFirst({
      where: { status: "QUEUED" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    if (!next) return null;
    const { count } = await prisma.renderJob.updateMany({
      where: { id: next.id, status: "QUEUED" },
      data: {
        status: "RENDERING",
        workerId,
        heartbeatAt: new Date(now),
        startedAt: new Date(now),
        attempts: { increment: 1 },
        progress: 0,
        errorMessage: null,
      },
    });
    // 0: another worker was faster - look for the next one.
    if (count === 1) {
      return prisma.renderJob.findUniqueOrThrow({ where: { id: next.id } });
    }
  }
}

/**
 * Writes to a job on behalf of the worker that holds it. Returns false -
 * and changes nothing - if the job is no longer this worker's: it was
 * handed to another one after a missed heartbeat, or deleted.
 */
async function updateOwnJob(
  jobId: string,
  workerId: string,
  data: Parameters<typeof prisma.renderJob.updateMany>[0]["data"],
): Promise<boolean> {
  const { count } = await prisma.renderJob.updateMany({
    where: { id: jobId, workerId, status: "RENDERING" },
    data,
  });
  return count === 1;
}

/** "Still drawing" - optionally with the progress (0 to 1) so far. */
export function reportAlive(jobId: string, workerId: string, progress?: number) {
  return updateOwnJob(jobId, workerId, {
    heartbeatAt: new Date(),
    ...(progress === undefined ? {} : { progress }),
  });
}

export function markJobDone(jobId: string, workerId: string, outputPath: string) {
  return updateOwnJob(jobId, workerId, {
    status: "DONE",
    progress: 1,
    outputPath,
    completedAt: new Date(),
    workerId: null,
  });
}

export function markJobFailed(jobId: string, workerId: string, errorMessage: string) {
  return updateOwnJob(jobId, workerId, {
    status: "FAILED",
    errorMessage,
    workerId: null,
  });
}
