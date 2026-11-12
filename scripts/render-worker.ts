// A render worker of its own: takes jobs from the queue in the database
// and draws them, without serving the website. For a machine that only
// renders - it needs the same database and the same storage folder as the
// web server, the render bundle (`pnpm remotion:bundle`), the same
// AUTH_SECRET, and INTERNAL_URL set to where it reaches the app.
//
//   pnpm worker
//
// Set RENDER_WORKER="off" on the web server if it should not render itself.
import "dotenv/config";
import { runRenderWorkerForever } from "../src/lib/renderWorker";

runRenderWorkerForever().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
