import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  DeleteAccountForm,
  ManageSubscriptionButton,
  PasswordForm,
} from "@/components/AccountForms";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured } from "@/lib/stripe";
import { TIER_LIMITS } from "@/lib/tiers";
import { RESOLUTIONS } from "../../../remotion/types";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "long" });
const sectionLabel = "font-mono text-[11px] tracking-[0.12em] text-muted uppercase";
const card = "flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6";

/** The account of the signed-in user: plan, password, deleting the account. */
export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      tier: true,
      createdAt: true,
      stripeCustomerId: true,
      _count: { select: { projects: true, savedScenes: true, renderJobs: true } },
    },
  });
  if (!user) redirect("/login?callbackUrl=/account");

  const limits = TIER_LIMITS[user.tier];
  const hasSubscription = Boolean(user.stripeCustomerId) && isStripeConfigured();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Account</h1>
        <p className="text-sm text-muted">
          {user.email} · member since {dateFormat.format(user.createdAt)}
        </p>
      </div>

      <section className={card}>
        <h2 className={sectionLabel}>Plan</h2>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={`text-2xl font-semibold tracking-tight ${user.tier === "PREMIUM" ? "text-brand" : "text-ink"}`}>
            {user.tier === "PREMIUM" ? "Premium" : "Free"}
          </span>
          <span className="text-sm text-muted">
            up to {RESOLUTIONS[limits.maxResolution].label},{" "}
            {limits.frameRates.join(" / ")} fps,{" "}
            {limits.watermark ? "with watermark" : "no watermark"}
          </span>
        </div>
        {hasSubscription ? (
          <ManageSubscriptionButton />
        ) : user.tier === "FREE" ? (
          <Link
            href="/pricing"
            className="w-fit rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold tracking-wide text-canvas outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ink"
          >
            See Premium
          </Link>
        ) : null}
        <p className="text-xs text-muted">
          {user._count.projects} projects · {user._count.savedScenes} own
          templates · {user._count.renderJobs} videos -{" "}
          <Link href="/dashboard" className="text-accent underline">
            open the dashboard
          </Link>
        </p>
      </section>

      <section className={card}>
        <h2 className={sectionLabel}>Password</h2>
        <PasswordForm />
      </section>

      <section className={card}>
        <h2 className={sectionLabel}>Delete account</h2>
        <p className="max-w-lg text-sm leading-relaxed text-muted">
          Removes the account with all its projects, own templates, uploaded
          files and rendered videos. Share links to your templates stop
          working. This cannot be undone.
        </p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
