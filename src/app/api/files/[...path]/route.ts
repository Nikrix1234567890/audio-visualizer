import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { auth } from "@/auth";
import { canReadFile } from "@/lib/fileAccess";
import { fileExists, getAbsolutePath, getFileSize } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".glb": "model/gltf-binary",
};

// Browsers (notably Chrome) can fail to determine an <audio>/<video> element's
// duration (reporting `Infinity`) when the server doesn't support byte-range
// requests. Remotion's getAudioDurationInSeconds()/useAudioData() rely on
// this working correctly, so we implement basic Range support here.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const key = segments.join("/");

  let exists: boolean;
  try {
    exists = fileExists(key);
  } catch {
    return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  }

  // A file that belongs to an account is only handed to that account (or
  // to a render it started). Not found and not yours get the same answer.
  const isAllowed =
    exists &&
    (await canReadFile(
      key,
      async () => (await auth())?.user?.id ?? null,
      new URL(request.url).searchParams.get("t"),
    ));

  if (!isAllowed) {
    return NextResponse.json(
      { error: "File not found." },
      { status: 404 },
    );
  }

  const absolutePath = getAbsolutePath(key);
  const extension = key.slice(key.lastIndexOf(".")).toLowerCase();
  const contentType = CONTENT_TYPES[extension] || "application/octet-stream";
  const totalSize = getFileSize(key);

  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    const start = match?.[1] ? parseInt(match[1], 10) : 0;
    const end = match?.[2] ? parseInt(match[2], 10) : totalSize - 1;
    const safeEnd = Math.min(end, totalSize - 1);
    const chunkSize = safeEnd - start + 1;

    const fullData = await readFile(absolutePath);
    const chunk = fullData.subarray(start, safeEnd + 1);

    return new NextResponse(new Uint8Array(chunk), {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(chunkSize),
        "Content-Range": `bytes ${start}-${safeEnd}/${totalSize}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      },
    });
  }

  const data = await readFile(absolutePath);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(totalSize),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}
