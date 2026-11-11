import { sanitizeScene } from "../../remotion/scene/sanitize";

/** Most own templates one account may keep. */
export const MAX_SAVED_SCENES = 50;

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;
const MAX_TITLE_LENGTH = 60;

/** Plain JSON, as a database Json column stores it. */
type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Cleans what the editor sends when keeping a scene as a template. */
export function parseSavedSceneInput(body: unknown): {
  title: string;
  scene: { [key: string]: Json };
} {
  const raw = (body ?? {}) as Record<string, unknown>;
  const title =
    typeof raw.title === "string"
      ? raw.title.replace(CONTROL_CHARACTERS, "").trim().slice(0, MAX_TITLE_LENGTH)
      : "";
  return {
    title: title || "My template",
    scene: JSON.parse(JSON.stringify(sanitizeScene(raw.scene))) as {
      [key: string]: Json;
    },
  };
}
