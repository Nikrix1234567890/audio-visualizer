import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTier } from "@/lib/userTier";

/**
 * What the editor needs to know about the visitor: their plan. Read fresh
 * from the database on every call, so an upgrade shows without logging in
 * again.
 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  return NextResponse.json({
    isLoggedIn: Boolean(userId),
    tier: await getTier(userId),
  });
}
