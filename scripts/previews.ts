// Renders the short silent loops that play when a template card is hovered
// (public/previews/<id>.mp4), plus portrait versions of a few templates for
// the landing page (public/previews/portrait/<id>.mp4).
//
// Run `pnpm previews` after adding or changing a template. It rebuilds the
// Remotion bundle first. Pass ids to redo only some: `pnpm previews galaxy`.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import { TEMPLATES } from "../remotion/scene/templates";
import { getFreePort } from "../src/lib/freePort";

const BUNDLE_DIR = path.resolve(process.cwd(), ".remotion-bundle");
const OUT_DIR = path.resolve(process.cwd(), "public/previews");
const COMPOSITION_ID = "LoopPreview";
const FPS = 30;
/**
 * The stretch of the demo track that is shown: seconds 4 to 8. Its last
 * FADE_FRAMES melt into the frames just before second 4, so the clip loops
 * without a jump (see remotion/compositions/LoopPreview.tsx).
 */
const FROM_SECOND = 4;
const SECONDS = 4;
const FADE_FRAMES = 20;
/** Templates that also get a portrait loop. */
const PORTRAIT = ["galaxy", "pulseRing", "jellyfish", "helix"];

async function main() {
  const only = new Set(process.argv.slice(2));
  const templates = TEMPLATES.filter((t) => only.size === 0 || only.has(t.id));
  const jobs = [
    ...templates.map((t) => ({ t, file: `${t.id}.mp4`, width: 480, height: 270 })),
    ...templates
      .filter((t) => PORTRAIT.includes(t.id))
      .map((t) => ({ t, file: `portrait/${t.id}.mp4`, width: 360, height: 640 })),
  ];

  console.log("Bundling Remotion project...");
  await bundle({
    entryPoint: path.resolve(process.cwd(), "remotion/index.ts"),
    outDir: BUNDLE_DIR,
  });
  await mkdir(path.join(OUT_DIR, "portrait"), { recursive: true });

  const chromiumOptions = { gl: "angle" as const };
  const browser = await openBrowser("chrome", { chromiumOptions });

  try {
    for (const [index, job] of jobs.entries()) {
      const port = await getFreePort();
      // No audio source: the composition's default, the demo track inside
      // the bundle, drives the picture. The loop itself is silent.
      const inputProps = {
        scene: job.t.scene,
        appBase: `http://localhost:${port}/public`,
        loopStart: FROM_SECOND * FPS,
        loopFrames: SECONDS * FPS,
        fadeFrames: FADE_FRAMES,
      };
      const composition = await selectComposition({
        serveUrl: BUNDLE_DIR,
        id: COMPOSITION_ID,
        inputProps,
        puppeteerInstance: browser,
        chromiumOptions,
        port: await getFreePort(),
      });
      composition.width = job.width;
      composition.height = job.height;
      composition.fps = FPS;
      composition.durationInFrames = (FROM_SECOND + SECONDS) * FPS;

      await renderMedia({
        composition,
        serveUrl: BUNDLE_DIR,
        codec: "h264",
        crf: 30,
        muted: true,
        frameRange: [FROM_SECOND * FPS, (FROM_SECOND + SECONDS) * FPS - 1],
        outputLocation: path.join(OUT_DIR, job.file),
        inputProps,
        puppeteerInstance: browser,
        chromiumOptions,
        port,
      });
      console.log(`${index + 1}/${jobs.length}  ${job.file}`);
    }
  } finally {
    await browser.close({ silent: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
