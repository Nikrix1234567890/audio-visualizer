import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Prisma import here!). Used directly by
 * middleware.ts, and extended with the Credentials provider (which needs
 * Prisma/bcrypt, both Node-only) in src/auth.ts for use in Route Handlers
 * and Server Components.
 */
export const authConfig = {
  // This app runs as its own Node server (`next start`), not on a platform
  // that vouches for the host name. Without this, Auth.js refuses every
  // request in a production build ("UntrustedHost") and nobody can log in.
  // When deployed behind a reverse proxy, the proxy must set the Host
  // header itself and not pass on whatever the visitor sent.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = request.nextUrl.pathname.startsWith(
        "/dashboard",
      );
      if (isProtectedRoute && !isLoggedIn) {
        return false;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
