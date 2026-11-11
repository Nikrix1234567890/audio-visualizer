import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

// 3D models for Model elements. Only .glb: a single self-contained file.
// (.gltf usually points at separate texture and data files.)
const MODEL_EXTENSIONS = new Set([".glb"]);
const MAX_MODEL_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Generous but bounded, to avoid someone uploading a multi-GB file to a
// local dev server. Production (with real accounts/tiers) will enforce
// much stricter, tier-dependent limits.
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  // The field name says what the file is for: "audio" carries the track,
  // "image" a picture for an Image element, "model" a 3D model.
  const kinds = [
    { field: "image", extensions: IMAGE_EXTENSIONS, maxSize: MAX_IMAGE_SIZE_BYTES },
    { field: "model", extensions: MODEL_EXTENSIONS, maxSize: MAX_MODEL_SIZE_BYTES },
    { field: "audio", extensions: AUDIO_EXTENSIONS, maxSize: MAX_FILE_SIZE_BYTES },
  ];
  const kind = kinds.find((k) => formData?.get(k.field) instanceof File);
  const file = kind ? formData?.get(kind.field) : null;

  if (!kind || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file found in the 'audio', 'image' or 'model' field." },
      { status: 400 },
    );
  }

  const ALLOWED_EXTENSIONS = kind.extensions;
  const maxSize = kind.maxSize;

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

  // Remember whose file this is. A file uploaded while logged in is only
  // handed to that account afterwards (see src/lib/fileAccess.ts).
  const session = await auth();
  await prisma.upload.create({
    data: { key, userId: session?.user?.id ?? null, size: file.size },
  });

  return NextResponse.json({
    key,
    url: `/api/files/${key}`,
  });
}
