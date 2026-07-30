// Pre-bundles the Remotion project with Webpack so that API routes can call
// @remotion/renderer's selectComposition()/renderMedia() against a static
// bundle folder. Must be re-run whenever remotion/** source changes.
// @remotion/bundler cannot be called from inside a Next.js API route (it
// bundles Webpack itself) - see https://www.remotion.dev/docs/miscellaneous/nextjs
import path from "node:path";
import { bundle } from "@remotion/bundler";

const OUT_DIR = path.resolve(process.cwd(), ".remotion-bundle");

async function main() {
  console.log("Bundling Remotion project...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve(process.cwd(), "remotion/index.ts"),
    outDir: OUT_DIR,
    onProgress: (progress) => {
      process.stdout.write(`\rBundling: ${progress}%   `);
    },
  });
  console.log(`\nBundle ready at ${bundleLocation}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
