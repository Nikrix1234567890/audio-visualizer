import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { HOUR, clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { isTokenValid, tokenUserId } from "@/lib/tokens";

const MIN_PASSWORD_LENGTH = 8;
const INVALID_LINK =
  "This link is no longer valid. Ask for a new one on the login page.";

/** Sets a new password for the account a reset link was mailed to. */
export async function POST(request: Request) {
  if (!rateLimit(`reset:${clientIp(request)}`, 10, HOUR)) {
    return tooManyRequests("attempts");
  }

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const userId = tokenUserId(token);
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  // The token is bound to the password it was issued for: once that
  // changes (by this very request, for one), the link stops working.
  if (!user || !isTokenValid("reset-password", token, user.passwordHash)) {
    return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `The password must be at least ${MIN_PASSWORD_LENGTH} characters long.` },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      // Whoever opened the link has the mailbox: that confirms the address.
      emailVerified: user.emailVerified ?? new Date(),
    },
  });
  return NextResponse.json({ ok: true });
}
