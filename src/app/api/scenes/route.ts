import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MAX_SAVED_SCENES, parseSavedSceneInput } from "@/lib/savedScenes";

const signInRequired = () =>
  NextResponse.json({ error: "Log in to keep your own templates." }, { status: 401 });

/** The signed-in user's own templates, newest first. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return signInRequired();

  const scenes = await prisma.savedScene.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });
  return NextResponse.json({ scenes });
}

/** Keeps a scene as one of the signed-in user's templates. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return signInRequired();

  const count = await prisma.savedScene.count({
    where: { userId: session.user.id },
  });
  if (count >= MAX_SAVED_SCENES) {
    return NextResponse.json(
      {
        error: `You have reached the limit of ${MAX_SAVED_SCENES} templates. Delete one to save a new one.`,
      },
      { status: 409 },
    );
  }

  const input = parseSavedSceneInput(await request.json().catch(() => null));
  const saved = await prisma.savedScene.create({
    data: { ...input, userId: session.user.id },
    select: { id: true, title: true },
  });
  return NextResponse.json(saved, { status: 201 });
}
