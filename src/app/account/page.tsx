import { Crown, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  DeleteAccountForm,
  ManageSubscriptionButton,
  PasswordForm,
  ResendConfirmationButton,
} from "@/components/AccountForms";
import { Rise, Stagger, StaggerItem } from "@/components/site/kit";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured } from "@/lib/stripe";
import { TIER_LIMITS } from "@/lib/tiers";
import { RESOLUTIONS } from "../../../remotion/types";

export const metadata: Metadata = { title: "Account" };

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "long" });

/** The account of the signed-in user: plan, password, deleting the account. */
export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      emailVerified: true,
      tier: true,
      createdAt: true,
      stripeCustomerId: true,
      _count: { select: { projects: true, savedScenes: true, renderJobs: true } },
    },
  });
  if (!user) redirect("/login?callbackUrl=/account");

  const limits = TIER_LIMITS[user.tier];
  const hasSubscription = Boolean(user.stripeCustomerId) && isStripeConfigured();
  const isPremium = user.tier === "PREMIUM";

  return (
    <div className="site db">
      <div className="db-wrap acct">
        <Rise className="db-head">
          <div className="pf-stack gap-1.5">
            <h1 className="db-h1">Account</h1>
            <span className="db-sub">
              {user.email} · member since {dateFormat.format(user.createdAt)}
            </span>
          </div>
          <Link href="/dashboard" className="pf-btn pf-btn--secondary pf-btn--lg">
            Open the dashboard
          </Link>
        </Rise>

        <Stagger className="acct__cards" gap={0.08} delay={0.1}>
          {!user.emailVerified && (
            <StaggerItem as="section" className="pf-card acct__card">
              <h2 className="acct__h2">
                <Mail className="pf-i" aria-hidden />
                Confirm your address
              </h2>
              <p className="pf-card__text">
                We sent a mail with a link to {user.email}. Confirming it makes
                sure a forgotten password can be reset.
              </p>
              <ResendConfirmationButton />
            </StaggerItem>
          )}

          <StaggerItem as="section" className="pf-card acct__card">
            <h2 className="acct__h2">Plan</h2>
            <div className="acct__plan">
              <span className="acct__plan-name">
                {isPremium ? "Premium" : "Free"}
                {isPremium && (
                  <span className="pf-badge pf-badge--premium">
                    <Crown className="pf-i" aria-hidden />
                    Premium
                  </span>
                )}
              </span>
              <span className="pf-card__text">
                Exports up to {RESOLUTIONS[limits.maxResolution].label} at{" "}
                {limits.frameRates.join(" or ")} fps,{" "}
                {limits.watermark ? "with a small watermark" : "without a watermark"}.
              </span>
            </div>
            {hasSubscription ? (
              <ManageSubscriptionButton />
            ) : !isPremium ? (
              <Link href="/pricing" className="pf-btn pf-btn--premium pf-btn--lg w-fit">
                <Crown className="pf-i" aria-hidden />
                See Premium
              </Link>
            ) : null}
            <dl className="acct__counts">
              <div>
                <dd>{user._count.projects}</dd>
                <dt>projects</dt>
              </div>
              <div>
                <dd>{user._count.savedScenes}</dd>
                <dt>own templates</dt>
              </div>
              <div>
                <dd>{user._count.renderJobs}</dd>
                <dt>videos</dt>
              </div>
            </dl>
          </StaggerItem>

          <StaggerItem as="section" className="pf-card acct__card">
            <h2 className="acct__h2">Password</h2>
            <PasswordForm />
          </StaggerItem>

          <StaggerItem as="section" className="pf-card acct__card acct__card--danger">
            <h2 className="acct__h2">Delete account</h2>
            <p className="pf-card__text">
              Removes the account with all its projects, own templates, uploaded
              files and rendered videos. Share links to your templates stop
              working. This cannot be undone.
            </p>
            <DeleteAccountForm />
          </StaggerItem>
        </Stagger>
      </div>
    </div>
  );
}
