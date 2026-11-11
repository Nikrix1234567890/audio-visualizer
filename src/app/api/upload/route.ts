import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { saveFile } from "@/lib/storage";

const AUDIO_EXTENSIONS = new Set([
  ".wav",
  ".mp3",
  ".m4a",
  ".aac",
  ".ogg",
  ".flac",
]);

// Pictures used by Image elements. SVG is deliberately not allowed: it can
// carry scripts.
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Generous but bounded, to avoid someone uploading a multi-GB file to a
// local dev server. Production (with real accounts/tiers) will enforce
// much stricter, tier-dependent limits.
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  // "audio" carries the track, "image" a picture for an Image element.
  const image = formData?.get("image");
  const isImage = image instanceof File;
  const file = isImage ? image : formData?.get("audio");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file found in the 'audio' or 'image' field." },
      { status: 400 },
    );
  }

  const ALLOWED_EXTENSIONS = isImage ? IMAGE_EXTENSIONS : AUDIO_EXTENSIONS;
  const maxSize = isImage ? MAX_IMAGE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;

  if (file.size === 0) {
    return NextResponse.json(
      { error: "The uploaded file is empty." },
      { status: 400 },
    );
  }

  if (file.size > maxSize) {
    return NextResponse.json(
      {
        error: `The file is too large (limit: ${Math.round(maxSize / 1024 / 1024)} MB).`,
      },
      { status: 413 },
    );
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      {
        error: `File type "${extension}" is not supported. Allowed: ${Array.from(
          ALLOWED_EXTENSIONS,
        ).join(", ")}`,
      },
      { status: 415 },
    );
  }

  const id = randomUUID();
  const key = `uploads/${id}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await saveFile(key, buffer);

  return NextResponse.json({
    key,
    url: `/api/files/${key}`,
  });
}
