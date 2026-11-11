import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Deliberately built from the edge-safe `authConfig` only (no Prisma import
// chain), since middleware runs in the Edge Runtime.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*"],
};
