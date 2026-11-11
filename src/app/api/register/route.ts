import { NextResponse } from "next/server";
import { publicOrigin } from "@/lib/origin";
import bcrypt from "bcryptjs";
import { sendVerifyLink } from "@/lib/accountMails";
import { prisma } from "@/lib/prisma";
import { HOUR, clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!rateLimit(`register:${clientIp(request)}`, 5, HOUR)) {
    return tooManyRequests("new accounts");
  }

  const body = await request.json().catch(() => null);

  const email =
    typeof body?.email === "string" ? body.email.toLowerCase().trim() : null;
  const password = typeof body?.password === "string" ? body.password : null;
  const name = typeof body?.name === "string" ? body.name.trim() : null;

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name || null,
    },
    select: { id: true, email: true },
  });

  // The account works right away; the mail only asks to confirm the
  // address. A mail that fails to send must not fail the registration.
  sendVerifyLink(user, publicOrigin(request)).catch((error) => {
    console.error("Sending the confirmation mail failed:", error);
  });

  return NextResponse.json({ user }, { status: 201 });
}
