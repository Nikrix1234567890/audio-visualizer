import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
