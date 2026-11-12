import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/site/AuthShell";
import { prisma } from "@/lib/prisma";
import { isTokenValid, tokenUserId } from "@/lib/tokens";

export const metadata: Metadata = { title: "Confirm your address" };

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** Where the link in the confirmation mail leads: marks the address as confirmed. */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const token = first((await searchParams).token) ?? "";
  const userId = tokenUserId(token);
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, emailVerified: true },
      })
    : null;

  // The token is bound to the address it was mailed to.
  const isValid = Boolean(user && isTokenValid("verify-email", token, user.email));
  if (user && isValid && !user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  return (
    <AuthShell title={isValid ? "Address confirmed" : "This link does not work"}>
      <p className="auth-text">
        {isValid
          ? `Thank you. ${user?.email} is confirmed.`
          : "It may be too old or already replaced by a newer one. You can ask for a fresh link on your account page."}
      </p>
      <Link
        href={isValid ? "/editor" : "/account"}
        className="pf-btn pf-btn--cta pf-btn--lg pf-btn--block"
      >
        {isValid ? "Open the editor" : "Go to your account"}
      </Link>
    </AuthShell>
  );
}
