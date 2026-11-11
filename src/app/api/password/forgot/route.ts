import { NextResponse } from "next/server";
import { sendResetLink } from "@/lib/accountMails";
import { prisma } from "@/lib/prisma";
import { HOUR, clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

/**
 * Mails a password-reset link. The answer is the same whether or not an
 * account with that address exists, so addresses cannot be probed.
 */
export async function POST(request: Request) {
  if (!rateLimit(`forgot:${clientIp(request)}`, 5, HOUR)) {
    return tooManyRequests("reset requests");
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";

  // At most three mails an hour to one address, whoever asks.
  if (email && rateLimit(`forgot-to:${email}`, 3, HOUR)) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await sendResetLink(user, new URL(request.url).origin).catch((error) => {
        console.error("Sending the reset mail failed:", error);
      });
    }
  }

  return NextResponse.json({ ok: true });
}
