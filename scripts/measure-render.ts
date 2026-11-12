// Measures how fast this machine renders: draws a few seconds of the demo
// track with one template, exactly like a server render does, and prints
// the frames per second. Use it to judge a machine before making it the
// server, and to compare graphics backends:
//
//   pnpm measure                          the machine's default backend
//   RENDER_GL=swangle pnpm measure        software drawing, as on a server
//                                         without a graphics card
//   pnpm measure --resolution 720p --fps 30 --seconds 20 --template galaxy
//
// RENDER_CONCURRENCY is honoured like in a real render. Needs the render
// bundle (`pnpm remotion:bundle`); the app itself does not have to run.
import fs from "node:fs";
import { rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { TEMPLATES, DEFAULT_TEMPLATE } from "../remotion/scene/templates";
import { outputSize } from "../remotion/types";
import { getFreePort } from "../src/lib/freePort";
import { renderConcurrency, renderGl } from "../src/lib/renderSettings";
import { sanitizeFrameRate, sanitizeResolution } from "../src/lib/visualizerSettings";

const BUNDLE_DIR = path.resolve(process.cwd(), ".remotion-bundle");
const COMPOSITION_ID = "AudioVisualizer3D";

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  if (!fs.existsSync(BUNDLE_DIR)) {
    throw new Error("No render bundle found. Run `pnpm remotion:bundle` first.");
  }

  const resolutionKey = sanitizeResolution(option("resolution") ?? "1080p");
  const fps = sanitizeFrameRate(Number(option("fps") ?? 30));
  const wantedSeconds = Math.max(1, Number(option("seconds")) || 10);
  const templateId = option("template");
  const template = TEMPLATES.find((t) => t.id === templateId) ?? DEFAULT_TEMPLATE;
  if (templateId && template.id !== templateId) {
    throw new Error(`Unknown template "${templateId}".`);
  }

  const chromiumOptions = { gl: renderGl() };
  const port = await getFreePort();
  // The demo track inside the bundle is the sound; fonts come from the
  // bundle's copy of the public folder (as in scripts/thumbnails.ts).
  const inputProps = {
    scene: template.scene,
    appBase: `http://localhost:${port}/public`,
  };

  const composition = await selectComposition({
    serveUrl: BUNDLE_DIR,
    id: COMPOSITION_ID,
    inputProps,
    chromiumOptions,
    port: await getFreePort(),
  });
  const size = outputSize("16:9", resolutionKey);
  const trackSeconds = composition.durationInFrames / composition.fps;
  const seconds = Math.min(wantedSeconds, trackSeconds);
  composition.width = size.width;
  composition.height = size.height;
  composition.fps = fps;
  composition.durationInFrames = Math.max(1, Math.floor(trackSeconds * fps));
  const frames = Math.max(1, Math.floor(seconds * fps));

  const output = path.join(os.tmpdir(), `measure-render-${process.pid}.mp4`);
  console.log(
    `Rendering ${seconds} s of "${template.id}" at ${size.width}x${size.height}, ${fps} fps ` +
      `(${frames} frames), backend "${chromiumOptions.gl}", ` +
      `concurrency ${renderConcurrency() ?? "default"}, ${os.cpus().length} threads ...`,
  );

  // The clock starts at the first drawn frame, so opening the browser and
  // analysing the track are not counted against the drawing speed.
  let firstFrameAt: number | null = null;
  let lastFrameAt = 0;
  let framesSeen = 0;
  const startedAt = Date.now();
  try {
    await renderMedia({
      composition,
      serveUrl: BUNDLE_DIR,
      codec: "h264",
      outputLocation: output,
      inputProps,
      chromiumOptions,
      concurrency: renderConcurrency(),
      frameRange: [0, frames - 1],
      port,
      onProgress: ({ renderedFrames }) => {
        if (renderedFrames > 0 && firstFrameAt === null) firstFrameAt = Date.now();
        if (renderedFrames > framesSeen) {
          framesSeen = renderedFrames;
          lastFrameAt = Date.now();
        }
      },
    });
  } finally {
    await rm(output, { force: true });
  }

  const totalSeconds = (Date.now() - startedAt) / 1000;
  const drawSeconds = firstFrameAt === null ? totalSeconds : (lastFrameAt - firstFrameAt) / 1000;
  const drawFps = drawSeconds > 0 ? (frames - 1) / drawSeconds : NaN;
  console.log(`Drawing:  ${drawFps.toFixed(1)} frames per second`);
  console.log(
    `Whole run: ${totalSeconds.toFixed(1)} s for ${seconds} s of video ` +
      `(${(totalSeconds / seconds).toFixed(1)}x the video's length, start-up and encoding included)`,
  );
  console.log(
    `A 3-minute song at these settings: about ${((180 * fps) / drawFps / 60).toFixed(1)} minutes.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
