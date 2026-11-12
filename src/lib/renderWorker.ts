import { randomUUID } from "node:crypto";
import os from "node:os";
import { hasRenderBundle, runRenderJob } from "@/lib/renderJob";
import { claimNextJob } from "@/lib/renderQueue";

// Takes jobs from the queue, one after another. A render keeps a headless
// browser and the graphics card busy; several at once in one process would
// slow each other down to the point where none finishes in reasonable time
// (and could exhaust memory). More throughput comes from more workers on
// more machines, not from more renders per worker.

/** How often an idle worker looks for jobs it was not told about. */
const POLL_MS = 5_000;

type WorkerState = {
  id: string;
  isBusy: boolean;
  /** Set when a job arrived while the worker was already looking. */
  lookAgain: boolean;
  timer: ReturnType<typeof setInterval> | null;
  /** Always the newest version of `work`, see the bottom of this file. */
  work: () => Promise<void>;
};

// Survives hot reloads in development, like the Prisma client does.
const globalForWorker = globalThis as unknown as { renderWorker?: WorkerState };
const state: WorkerState = (globalForWorker.renderWorker ??= {
  id: `${os.hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`,
  isBusy: false,
  lookAgain: false,
  timer: null,
  work: async () => {},
});

// One render browser at a time in this process, whatever it draws.
const globalForTurns = globalThis as unknown as { renderTurn?: Promise<void> };

/**
 * Runs `task` once everything this process is drawing has finished: the
 * videos from the queue, and small extras like the picture of a saved
 * project, which are not jobs in the database (losing one in a restart is
 * harmless).
 */
export function inRenderTurn(task: () => Promise<void>): Promise<void> {
  const turn = (globalForTurns.renderTurn ?? Promise.resolve()).then(task);
  // A failed task must not block the ones after it.
  globalForTurns.renderTurn = turn.catch(() => {});
  return turn;
}

/** False when this process should leave rendering to separate workers. */
export function isWorkerEnabled(): boolean {
  return process.env.RENDER_WORKER?.trim().toLowerCase() !== "off";
}

async function work() {
  if (state.isBusy) {
    state.lookAgain = true;
    return;
  }
  state.isBusy = true;
  try {
    do {
      state.lookAgain = false;
      // Without the bundle nothing can be drawn; leave the jobs waiting
      // rather than failing them (new ones are refused by the route).
      if (!hasRenderBundle()) return;
      for (;;) {
        const job = await claimNextJob(state.id);
        if (!job) break;
        await inRenderTurn(() => runRenderJob(job, state.id));
      }
    } while (state.lookAgain);
  } catch (error) {
    // The database was unreachable, for example. The next poll tries again.
    console.error("The render worker could not take a job:", error);
  } finally {
    state.isBusy = false;
  }
}
// The timer below outlives a hot reload; pointing it at the state keeps it
// running the current code instead of the version that started it.
state.work = work;

/**
 * Starts this process's worker (once) and has it look for a job right
 * away. Call it when the process starts and whenever a job was created.
 */
export function startRenderWorker() {
  if (!isWorkerEnabled()) return;
  if (!state.timer) {
    // Catches what no call announces: jobs created by another process, and
    // jobs handed back after their worker went silent.
    state.timer = setInterval(() => void state.work(), POLL_MS);
    // An idle worker must not keep a script (or a test run) alive.
    state.timer.unref?.();
  }
  void state.work();
}

/** Runs the worker in the foreground until the process is stopped. */
export async function runRenderWorkerForever(): Promise<never> {
  console.log(`Render worker ${state.id} is waiting for jobs.`);
  for (;;) {
    await work();
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}
