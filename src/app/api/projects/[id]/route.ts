import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { claimFiles, fileOwner, sceneAssetKeys } from "@/lib/fileAccess";
import { prisma } from "@/lib/prisma";
import { projectThumbnailKey, queueProjectThumbnail } from "@/lib/projectThumbnail";
import { deleteFile } from "@/lib/storage";
import {
  TRACK_MISSING,
  parseProjectInput,
  toProjectResponse,
} from "@/lib/projects";

type Context = { params: Promise<{ id: string }> };

/**
 * The project with this id, but only if it belongs to the signed-in user.
 * Someone else's project and a project that does not exist get the same
 * answer, so ids cannot be probed.
 */
async function findOwnProject(context: Context) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      response: NextResponse.json(
        { error: "Log in to open your projects." },
        { status: 401 },
      ),
    };
  }

  const { id } = await context.params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) {
    return {
      response: NextResponse.json(
        { error: "This project does not exist." },
        { status: 404 },
      ),
    };
  }

  return { project };
}

export async function GET(_request: Request, context: Context) {
  const found = await findOwnProject(context);
  if (!found.project) return found.response;
  return NextResponse.json(toProjectResponse(found.project));
}

export async function PUT(request: Request, context: Context) {
  const found = await findOwnProject(context);
  if (!found.project) return found.response;

  const input = parseProjectInput(await request.json().catch(() => null));
  if ("error" in input) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  const userId = found.project.userId;
  const audioOwner = await fileOwner(input.audioPath);
  if (audioOwner && audioOwner !== userId) {
    return NextResponse.json({ error: TRACK_MISSING }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id: found.project.id },
    data: input,
  });
  await claimFiles(
    [input.audioPath, ...sceneAssetKeys(toProjectResponse(project).scene)],
    userId,
  );
  const saved = toProjectResponse(project);
  queueProjectThumbnail({
    projectId: project.id,
    userId,
    audioKey: saved.audioKey,
    scene: saved.scene,
    origin: new URL(request.url).origin,
  });
  return NextResponse.json(saved);
}

export async function DELETE(_request: Request, context: Context) {
  const found = await findOwnProject(context);
  if (!found.project) return found.response;

  await prisma.project.delete({ where: { id: found.project.id } });
  await deleteFile(projectThumbnailKey(found.project.id));
  return NextResponse.json({ ok: true });
}
