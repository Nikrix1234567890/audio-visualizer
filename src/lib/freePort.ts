import { createServer } from "node:net";

/**
 * Asks the OS for a free TCP port. Remotion serves the bundle from its own
 * small HTTP server and by default starts looking at port 3000 - the same
 * port this Next.js app usually runs on. On Windows both can end up bound to
 * 3000, and the render browser then loads the Next.js app instead of the
 * Remotion bundle. Handing Remotion an explicit free port avoids that.
 */
export function getFreePort(): Promise<number> {
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
