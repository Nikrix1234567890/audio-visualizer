import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const job = await prisma.renderJob.findUnique({ where: { id: jobId } });

  // A render started while logged in is only shown to that account. Someone
  // else's job and a job that does not exist get the same answer.
  const isForeign =
    job?.userId && (await auth())?.user?.id !== job.userId;

  if (!job || isForeign) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    progress: job.progress,
    url: job.outputPath ? `/api/files/${job.outputPath}` : null,
    error: job.errorMessage,
  });
}

/** Deletes one of the signed-in user's finished videos. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  const { jobId } = await params;
  const job = await prisma.renderJob.findFirst({
    where: { id: jobId, userId: session.user.id },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  // A render that is still running writes its file when it finishes; it
  // can be deleted once it is done.
  if (job.status === "QUEUED" || job.status === "RENDERING") {
    return NextResponse.json(
      { error: "This video is still rendering." },
      { status: 409 },
    );
  }
  if (job.outputPath) await deleteFile(job.outputPath);
  await prisma.renderJob.delete({ where: { id: job.id } });
  return NextResponse.json({ ok: true });
}
