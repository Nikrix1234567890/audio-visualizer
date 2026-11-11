// Renders the preview pictures shown in the editor's template gallery and
// element catalogue: one still per template and one per element type, drawn
// by the same composition as every video, with the demo track as sound.
//
// Run `pnpm thumbnails` after adding or changing a template or an element.
// It rebuilds the Remotion bundle first, so the pictures always show the
// current code. Pass ids to redo only some: `pnpm thumbnails galaxy helix`.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import {
  DEFAULT_CAMERA,
  DEFAULT_LOOK,
  ELEMENT_TYPES,
  createElement,
  type SceneDocument,
} from "../remotion/scene/definitions";
import { TEMPLATES } from "../remotion/scene/templates";
import { getFreePort } from "../src/lib/freePort";
import { renderGl } from "../src/lib/renderSettings";

const BUNDLE_DIR = path.resolve(process.cwd(), ".remotion-bundle");
const OUT_DIR = path.resolve(process.cwd(), "public/thumbnails");
const COMPOSITION_ID = "AudioVisualizer3D";
/** A moment of the demo track where bass, mids and highs are all sounding. */
const SECONDS = 6.2;
/** 1280x720 drawn, saved at 480x270 - sharp on high-density screens at card size. */
const SCALE = 0.375;

const NO_PICTURE: string[] = ["image", "model"];

type Job = { file: string; scene: SceneDocument };

function elementScene(type: (typeof ELEMENT_TYPES)[number]): SceneDocument {
  return {
    version: 1,
    // A still camera in front of and slightly above the element: flat
    // elements that face the viewer and ones that lie on the floor both
    // read well from there.
    camera: { ...DEFAULT_CAMERA, orbit: 0, sway: 0, drift: 0, bob: 0, height: 3 },
    cameraBindings: {},
    look: { ...DEFAULT_LOOK },
    lookBindings: {},
    elements: [createElement(type, { id: "only" })],
  };
}

async function main() {
  const only = new Set(process.argv.slice(2));
  const wanted = (id: string) => only.size === 0 || only.has(id);

  const jobs: Job[] = [
    ...TEMPLATES.filter((t) => wanted(t.id)).map((t) => ({
      file: `templates/${t.id}.jpg`,
      scene: t.scene,
    })),
    ...ELEMENT_TYPES.filter(
      // Empty until the user picks a file - nothing to show.
      (type) => wanted(type) && !NO_PICTURE.includes(type),
    ).map((type) => ({
      file: `elements/${type}.jpg`,
      scene: elementScene(type),
    })),
  ];

  console.log("Bundling Remotion project...");
  await bundle({
    entryPoint: path.resolve(process.cwd(), "remotion/index.ts"),
    outDir: BUNDLE_DIR,
  });

  await mkdir(path.join(OUT_DIR, "templates"), { recursive: true });
  await mkdir(path.join(OUT_DIR, "elements"), { recursive: true });

  const chromiumOptions = { gl: renderGl() };
  const browser = await openBrowser("chrome", { chromiumOptions });

  try {
    for (const [index, job] of jobs.entries()) {
      // The audio source is left out, so the composition's default - the
      // demo track inside the bundle - is used. The app itself is not
      // running here, so the text font is taken from the bundle's copy of
      // the public folder.
      const port = await getFreePort();
      const inputProps = {
        scene: job.scene,
        appBase: `http://localhost:${port}/public`,
      };
      const composition = await selectComposition({
        serveUrl: BUNDLE_DIR,
        id: COMPOSITION_ID,
        inputProps,
        puppeteerInstance: browser,
        chromiumOptions,
        port: await getFreePort(),
      });
      await renderStill({
        composition,
        serveUrl: BUNDLE_DIR,
        output: path.join(OUT_DIR, job.file),
        frame: Math.round(SECONDS * composition.fps),
        inputProps,
        imageFormat: "jpeg",
        jpegQuality: 82,
        scale: SCALE,
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
