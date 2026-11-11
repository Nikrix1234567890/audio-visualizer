import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { MINUTE, clientIp, rateLimit } from "@/lib/rateLimit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Email & Passwort",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        // A brake on guessing passwords: ten tries in ten minutes per
        // visitor and per account. Past that, even the right password is
        // refused until the window has passed.
        const address = email.toLowerCase().trim();
        const withinLimits =
          rateLimit(`login:${clientIp(request)}`, 10, 10 * MINUTE) &&
          rateLimit(`login-to:${address}`, 10, 10 * MINUTE);
        if (!withinLimits) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
});
