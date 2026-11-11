import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isTokenValid, tokenUserId } from "@/lib/tokens";

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
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {isValid ? "Address confirmed" : "This link does not work"}
      </h1>
      <p className="text-sm leading-relaxed text-muted">
        {isValid
          ? `Thank you - ${user?.email} is confirmed.`
          : "It may be too old or already replaced by a newer one. You can ask for a fresh link on your account page."}
      </p>
      <Link
        href={isValid ? "/editor" : "/account"}
        className="w-fit rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold tracking-wide text-canvas outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ink"
      >
        {isValid ? "Open the editor" : "Go to your account"}
      </Link>
    </div>
  );
}
