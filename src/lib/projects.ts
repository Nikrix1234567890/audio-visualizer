import { fileExists } from "@/lib/storage";
import {
  sanitizeAspect,
  sanitizeFrameRate,
  sanitizeResolution,
} from "@/lib/visualizerSettings";
import { sanitizeScene } from "../../remotion/scene/sanitize";

/** Storage key of an uploaded track, exactly as /api/upload hands it out. */
const AUDIO_KEY = /^uploads\/[0-9a-f-]{36}\.(wav|mp3|m4a|aac|ogg|flac)$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;
const MAX_TITLE_LENGTH = 80;
const MAX_NAME_LENGTH = 200;

/** Plain JSON, as a database Json column stores it. */
type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export const TRACK_MISSING =
  "The project's track is missing. Load a track and save again.";

/** Most projects one account may keep. */
export const MAX_PROJECTS_PER_USER = 100;

function cleanText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(CONTROL_CHARACTERS, "").trim().slice(0, maxLength);
  return cleaned || fallback;
}

/**
 * Checks and cleans what the editor sends when saving a project. Never
 * trust the client: the scene is sanitized like for a render, and the
 * track must be a real upload.
 */
export function parseProjectInput(body: unknown):
  | { error: string }
  | {
      title: string;
      audioPath: string;
      settings: {
        scene: Json;
        resolution: string;
        aspect: string;
        fps: number;
        audioName: string;
      };
    } {
  const raw = (body ?? {}) as Record<string, unknown>;

  const audioKey = raw.audioKey;
  if (typeof audioKey !== "string" || !AUDIO_KEY.test(audioKey) || !fileExists(audioKey)) {
    return { error: TRACK_MISSING };
  }

  return {
    title: cleanText(raw.title, "Untitled project", MAX_TITLE_LENGTH),
    audioPath: audioKey,
    settings: {
      // Through JSON once more: the column wants plain JSON, not typed objects.
      scene: JSON.parse(JSON.stringify(sanitizeScene(raw.scene))) as Json,
      resolution: sanitizeResolution(raw.resolution),
      aspect: sanitizeAspect(raw.aspect),
      fps: sanitizeFrameRate(raw.fps),
      audioName: cleanText(raw.audioName, "Track", MAX_NAME_LENGTH),
    },
  };
}

/** The shape the editor gets back when it opens or saves a project. */
export function toProjectResponse(project: {
  id: string;
  title: string;
  audioPath: string;
  settings: unknown;
  updatedAt: Date;
}) {
  const settings = (project.settings ?? {}) as Record<string, unknown>;
  return {
    id: project.id,
    title: project.title,
    audioKey: project.audioPath,
    audioName: typeof settings.audioName === "string" ? settings.audioName : "Track",
    scene: sanitizeScene(settings.scene),
    resolution: sanitizeResolution(settings.resolution),
    aspect: sanitizeAspect(settings.aspect),
    fps: sanitizeFrameRate(settings.fps),
    updatedAt: project.updatedAt.toISOString(),
  };
}
