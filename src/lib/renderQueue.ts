import { prisma } from "@/lib/prisma";

// Renders run one after another. A render keeps a headless browser and the
// graphics card busy; several at once would slow each other down to the
// point where none finishes in reasonable time (and could exhaust memory).
//
// The queue lives in this server process. That is enough for a single
// self-hosted server; several servers would need a shared queue instead.

/** Most renders that may wait at once, over all users. */
export const MAX_WAITING = 20;
/** Most unfinished renders one account may have. */
export const MAX_PER_USER = 3;

type QueueState = { tail: Promise<void>; isRecovered: boolean };

// Survives hot reloads in development, like the Prisma client does.
const globalForQueue = globalThis as unknown as { renderQueue?: QueueState };
const state: QueueState = (globalForQueue.renderQueue ??= {
  tail: Promise.resolve(),
  isRecovered: false,
});

/**
 * Jobs that were waiting or rendering when the server last stopped will
 * never finish: nothing remembers them. Marks them failed, once per start,
 * so they do not look busy forever.
 */
async function recoverOnce() {
  if (state.isRecovered) return;
  state.isRecovered = true;
  await prisma.renderJob.updateMany({
    where: { status: { in: ["QUEUED", "RENDERING"] } },
    data: {
      status: "FAILED",
      errorMessage: "The server was restarted before this video was finished. Render it again.",
    },
  });
}

/**
 * Why a new render cannot be accepted right now, or null if it can. Call
 * before creating the job.
 */
export async function queueRefusal(userId: string | null): Promise<string | null> {
  await recoverOnce();
  const waiting = await prisma.renderJob.count({
    where: { status: { in: ["QUEUED", "RENDERING"] } },
  });
  if (waiting >= MAX_WAITING) {
    return "Too many videos are waiting to be rendered right now. Try again in a few minutes.";
  }
  if (userId) {
    const own = await prisma.renderJob.count({
      where: { userId, status: { in: ["QUEUED", "RENDERING"] } },
    });
    if (own >= MAX_PER_USER) {
      return `You already have ${MAX_PER_USER} videos rendering or waiting. Wait for one to finish.`;
    }
  }
  return null;
}

/** Runs `render` once every render queued before it has finished. */
export function enqueueRender(render: () => Promise<void>) {
  state.tail = state.tail.then(render).catch((error) => {
    console.error("A queued render threw:", error);
  });
}

/** How many renders are ahead of this job (0 = it is next or running). */
export async function queuePosition(job: {
  status: string;
  createdAt: Date;
}): Promise<number> {
  if (job.status !== "QUEUED") return 0;
  return prisma.renderJob.count({
    where: {
      status: { in: ["QUEUED", "RENDERING"] },
      createdAt: { lt: job.createdAt },
    },
  });
}
