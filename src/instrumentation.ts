// Runs once when the server starts (a Next.js convention).
export async function register() {
  // Not in the edge runtime, where neither the database nor a browser exist.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Renders that were waiting when the server last stopped are still in
  // the database: pick them up without waiting for the next request.
  const { startRenderWorker } = await import("@/lib/renderWorker");
  startRenderWorker();
}
