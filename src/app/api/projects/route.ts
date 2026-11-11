import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  MAX_PROJECTS_PER_USER,
  parseProjectInput,
  toProjectResponse,
} from "@/lib/projects";

// A fresh response per request: a response body can only be sent once.
const signInRequired = () =>
  NextResponse.json({ error: "Log in to save projects." }, { status: 401 });

/** The signed-in user's projects, most recently changed first. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return signInRequired();

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ projects });
}

/** Saves a new project for the signed-in user. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return signInRequired();

  const input = parseProjectInput(await request.json().catch(() => null));
  if ("error" in input) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  const count = await prisma.project.count({
    where: { userId: session.user.id },
  });
  if (count >= MAX_PROJECTS_PER_USER) {
    return NextResponse.json(
      {
        error: `You have reached the limit of ${MAX_PROJECTS_PER_USER} projects. Delete one to save a new one.`,
      },
      { status: 409 },
    );
  }

  const project = await prisma.project.create({
    data: { ...input, userId: session.user.id },
  });

  return NextResponse.json(toProjectResponse(project), { status: 201 });
}
