import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeScene } from "../../../../../remotion/scene/sanitize";

type Context = { params: Promise<{ id: string }> };

const notFound = () =>
  NextResponse.json({ error: "This template does not exist." }, { status: 404 });

/**
 * A saved scene. Deliberately open to anyone who has the id: that is the
 * share link. The id is random and cannot be guessed, and the answer holds
 * nothing but the scene and its title - no account details.
 */
export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const saved = await prisma.savedScene.findUnique({ where: { id } });
  if (!saved) return notFound();

  return NextResponse.json({
    id: saved.id,
    title: saved.title,
    scene: sanitizeScene(saved.scene),
  });
}

/** Only the owner can delete; for everyone else the template "does not exist". */
export async function DELETE(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  const { id } = await context.params;
  const { count } = await prisma.savedScene.deleteMany({
    where: { id, userId: session.user.id },
  });
  return count ? NextResponse.json({ ok: true }) : notFound();
}
