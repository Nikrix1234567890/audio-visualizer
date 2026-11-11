import fs from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { renderStill, selectComposition } from "@remotion/renderer";
import { createFileToken } from "@/lib/fileAccess";
import { getFreePort } from "@/lib/freePort";
import { enqueueRender } from "@/lib/renderQueue";
import { renderGl } from "@/lib/renderSettings";
import { getAbsolutePath } from "@/lib/storage";
import type { SceneDocument } from "../../remotion/scene/definitions";

// A small still of every saved project, shown in the dashboard. It is
// drawn by the same composition as the videos, after the project was
// saved, in the render queue - so it never competes with a running render.

const BUNDLE_DIR = path.resolve(process.cwd(), ".remotion-bundle");
/** The moment of the track the picture shows (or its last frame, if shorter). */
const AT_SECOND = 8;

/** Storage key of the picture of a project. */
export const projectThumbnailKey = (projectId: string) => `thumbs/${projectId}.jpg`;

/** Draws the picture of a project in the background. Failing is harmless. */
export function queueProjectThumbnail({
  projectId,
  userId,
  audioKey,
  scene,
  origin,
}: {
  projectId: string;
  userId: string;
  audioKey: string;
  scene: SceneDocument;
  origin: string;
}) {
  if (!fs.existsSync(BUNDLE_DIR)) return;

  enqueueRender(async () => {
    try {
      // The render browser has no login cookie; the token lets it read
      // the files of the project's owner.
      const fileToken = createFileToken(userId);
      const inputProps = {
        audioSrc: `${origin}/api/files/${audioKey}?t=${encodeURIComponent(fileToken)}`,
        scene,
        appBase: origin,
        fileToken,
      };
      const chromiumOptions = { gl: renderGl(), disableWebSecurity: true };
      const composition = await selectComposition({
        serveUrl: BUNDLE_DIR,
        id: "AudioVisualizer3D",
        inputProps,
        chromiumOptions,
        port: await getFreePort(),
      });

      const output = getAbsolutePath(projectThumbnailKey(projectId));
      await mkdir(path.dirname(output), { recursive: true });
      await renderStill({
        composition,
        serveUrl: BUNDLE_DIR,
        output,
        frame: Math.min(
          composition.durationInFrames - 1,
          Math.round(AT_SECOND * composition.fps),
        ),
        inputProps,
        imageFormat: "jpeg",
        jpegQuality: 80,
        scale: 0.375,
        chromiumOptions,
        port: await getFreePort(),
      });
    } catch (error) {
      console.error(`Drawing the picture of project ${projectId} failed:`, error);
    }
  });
}
