import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendVerifyLink } from "@/lib/accountMails";
import { prisma } from "@/lib/prisma";
import { HOUR, rateLimit, tooManyRequests } from "@/lib/rateLimit";

/** Mails the signed-in user a fresh link to confirm their address. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  if (!rateLimit(`verify:${session.user.id}`, 3, HOUR)) {
    return tooManyRequests("confirmation mails");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, emailVerified: true },
  });
  if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  if (user.emailVerified) return NextResponse.json({ ok: true, alreadyConfirmed: true });

  try {
    await sendVerifyLink(user, new URL(request.url).origin);
  } catch (error) {
    console.error("Sending the confirmation mail failed:", error);
    return NextResponse.json(
      { error: "The mail could not be sent. Try again in a moment." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
