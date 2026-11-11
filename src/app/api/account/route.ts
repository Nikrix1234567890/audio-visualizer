import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";

const MIN_PASSWORD_LENGTH = 8;

/** The signed-in user with their password hash, or null. */
async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

const signInRequired = () =>
  NextResponse.json({ error: "Log in first." }, { status: 401 });

/** Changes the password. Needs the current one, so a borrowed session cannot lock the owner out. */
export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) return signInRequired();

  const body = await request.json().catch(() => null);
  const current = typeof body?.current === "string" ? body.current : "";
  const next = typeof body?.next === "string" ? body.next : "";

  if (!(await bcrypt.compare(current, user.passwordHash))) {
    return NextResponse.json(
      { error: "The current password is not correct." },
      { status: 403 },
    );
  }
  if (next.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `The new password must be at least ${MIN_PASSWORD_LENGTH} characters long.` },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 12) },
  });
  return NextResponse.json({ ok: true });
}

/**
 * Deletes the account and everything that belongs to it: projects, own
 * templates, uploaded files and rendered videos. Needs the password.
 */
export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return signInRequired();

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "The password is not correct." },
      { status: 403 },
    );
  }

  // A running subscription would keep charging an account that no longer
  // exists. It has to be cancelled first (through "Manage subscription").
  if (user.tier === "PREMIUM" && user.stripeCustomerId) {
    return NextResponse.json(
      { error: "Cancel your Premium subscription first, then delete the account." },
      { status: 409 },
    );
  }

  const [uploads, jobs] = await Promise.all([
    prisma.upload.findMany({ where: { userId: user.id }, select: { key: true } }),
    prisma.renderJob.findMany({
      where: { userId: user.id },
      select: { id: true, outputPath: true },
    }),
  ]);
  for (const upload of uploads) await deleteFile(upload.key);
  for (const job of jobs) if (job.outputPath) await deleteFile(job.outputPath);

  await prisma.upload.deleteMany({ where: { userId: user.id } });
  await prisma.renderJob.deleteMany({ where: { userId: user.id } });
  // Projects and own templates go with the user (cascade).
  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true });
}
