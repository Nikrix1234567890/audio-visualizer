// Checks of the render queue in the database: who gets which job, and what
// happens to a job whose worker went silent. Runs against a throw-away
// SQLite file. Run with `pnpm test`.
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";

const folder = mkdtempSync(path.join(os.tmpdir(), "queue-test-"));
// Set before the app's database module is loaded (hence the imports below).
process.env.DATABASE_URL = `file:${path.join(folder, "test.db")}`;

type Queue = typeof import("../src/lib/renderQueue");
let queue: Queue;
let prisma: (typeof import("../src/lib/prisma"))["prisma"];

const T0 = Date.UTC(2026, 0, 1);

/** A waiting job; `minute` orders them. */
function addJob(minute: number, userId: string | null = null) {
  return prisma.renderJob.create({
    data: {
      audioKey: "uploads/none.wav",
      settings: {},
      userId,
      createdAt: new Date(T0 + minute * 60_000),
    },
  });
}

before(async () => {
  execSync("pnpm exec prisma migrate deploy", { env: process.env, stdio: "pipe" });
  queue = await import("../src/lib/renderQueue");
  ({ prisma } = await import("../src/lib/prisma"));
});

beforeEach(async () => {
  await prisma.renderJob.deleteMany();
  await prisma.user.deleteMany();
});

after(async () => {
  await prisma.$disconnect();
  rmSync(folder, { recursive: true, force: true });
});

test("jobs are handed out oldest first, each to one worker only", async () => {
  const second = await addJob(2);
  const first = await addJob(1);

  const [a, b, c] = await Promise.all([
    queue.claimNextJob("worker-a"),
    queue.claimNextJob("worker-b"),
    queue.claimNextJob("worker-c"),
  ]);
  const claimed = [a, b, c].filter((job) => job !== null);
  assert.equal(claimed.length, 2);
  assert.deepEqual(claimed.map((job) => job.id).sort(), [first.id, second.id].sort());
  assert.ok(claimed.every((job) => job.status === "RENDERING" && job.attempts === 1));
  assert.equal(await queue.claimNextJob("worker-a"), null);
});

test("the position in the queue counts the jobs ahead", async () => {
  const first = await addJob(1);
  const second = await addJob(2);
  const third = await addJob(3);
  assert.equal(await queue.queuePosition(first), 0);
  assert.equal(await queue.queuePosition(third), 2);
  await queue.claimNextJob("worker-a");
  // The rendering one is still ahead of those that wait.
  assert.equal(await queue.queuePosition(second), 1);
});

test("only the worker that holds a job can finish it", async () => {
  await addJob(1);
  const job = await queue.claimNextJob("worker-a");
  assert.ok(job);
  assert.equal(await queue.markJobDone(job.id, "worker-b", "renders/x.mp4"), false);
  assert.equal(await queue.reportAlive(job.id, "worker-a", 0.5), true);
  assert.equal(await queue.markJobDone(job.id, "worker-a", "renders/x.mp4"), true);
  const done = await prisma.renderJob.findUniqueOrThrow({ where: { id: job.id } });
  assert.equal(done.status, "DONE");
  assert.equal(done.outputPath, "renders/x.mp4");
  // Finished is finished: a late failure report changes nothing.
  assert.equal(await queue.markJobFailed(job.id, "worker-a", "late"), false);
});

test("a job whose worker went silent is handed out again, then given up on", async () => {
  const waiting = await addJob(2);
  const stuck = await addJob(1);
  const now = Date.now();
  const first = await queue.claimNextJob("worker-a", now);
  assert.equal(first?.id, stuck.id);

  // Still within the time a worker may stay silent: not handed out again.
  const soon = now + queue.ABANDONED_AFTER_MS - 1000;
  assert.equal((await queue.claimNextJob("worker-b", soon))?.id, waiting.id);
  assert.equal(await queue.claimNextJob("worker-c", soon), null);

  // Silent for too long: back in the queue, and taken by another worker.
  const later = now + queue.ABANDONED_AFTER_MS + 1000;
  const again = await queue.claimNextJob("worker-c", later);
  assert.equal(again?.id, stuck.id);
  assert.equal(again?.attempts, 2);
  // The first worker lost it and can no longer write to it.
  assert.equal(await queue.markJobDone(stuck.id, "worker-a", "renders/x.mp4"), false);

  // Silent a second time: failed for good instead of a third start.
  const muchLater = later + queue.ABANDONED_AFTER_MS + 1000;
  await queue.releaseAbandonedJobs(muchLater);
  const given = await prisma.renderJob.findUniqueOrThrow({ where: { id: stuck.id } });
  assert.equal(given.status, "FAILED");
  assert.ok(given.errorMessage);
});

test("new renders are refused when one account or the queue is full", async () => {
  const user = await prisma.user.create({
    data: { email: "queue@example.test", passwordHash: "x" },
  });
  for (let i = 0; i < queue.MAX_PER_USER; i++) await addJob(i, user.id);
  assert.match((await queue.queueRefusal(user.id)) ?? "", /already have/);
  assert.equal(await queue.queueRefusal(null), null);

  for (let i = queue.MAX_PER_USER; i < queue.MAX_WAITING; i++) await addJob(i);
  assert.match((await queue.queueRefusal(null)) ?? "", /Too many/);
});
