import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { saveFile } from "@/lib/storage";

const ALLOWED_EXTENSIONS = new Set([
  ".wav",
  ".mp3",
  ".m4a",
  ".aac",
  ".ogg",
  ".flac",
]);

// Generous but bounded, to avoid someone uploading a multi-GB file to a
// local dev server. Production (with real accounts/tiers) will enforce
// much stricter, tier-dependent limits.
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("audio");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Keine Audiodatei im Feld 'audio' gefunden." },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: "Die hochgeladene Datei ist leer." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Die Datei ist zu groß (Limit: 100 MB)." },
      { status: 413 },
    );
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      {
        error: `Dateityp "${extension}" wird nicht unterstützt. Erlaubt: ${Array.from(
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
