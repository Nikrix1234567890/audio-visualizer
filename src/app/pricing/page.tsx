import { Check, Clock, Crown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { PlanCards } from "@/components/PlanCards";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { PLAN_QUESTIONS } from "@/components/site/content";
import { Faq } from "@/components/site/Faq";
import { NoScript } from "@/components/site/NoScript";
import { ClosingCall, CompareTable, PageHero, SectionHead } from "@/components/site/sections";
import { UpgradeButton } from "@/components/UpgradeButton";
import { isStripeConfigured } from "@/lib/stripe";
import { getTier } from "@/lib/userTier";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free to make videos. Premium when you want them bigger and without the watermark.",
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** The plans, and the way to Premium: log in, then pay through Stripe. */
export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const justPaid = first((await searchParams).paid) === "1";
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const tier = await getTier(userId);

  // What sits under the Premium plan depends on where the visitor stands.
  const premiumAction =
    tier === "PREMIUM" ? (
      <p className="pf-banner pf-banner--premium">
        <Crown className="pf-i" aria-hidden />
        <span>
          <b>You are on Premium.</b> Manage it on your{" "}
          <Link href="/account" className="pf-link">
            account page
          </Link>
          .
        </span>
      </p>
    ) : !isStripeConfigured() ? (
      <p className="pf-banner">
        <Clock className="pf-i" aria-hidden />
        <span>
          <b>Premium is not on sale yet.</b> Everything on the free plan works today.
        </span>
      </p>
    ) : !userId ? (
      <Link
        href="/login?callbackUrl=/pricing"
        className="pf-btn pf-btn--cta pf-btn--lg pf-btn--block"
      >
        Log in to get Premium
      </Link>
    ) : (
      <UpgradeButton />
    );

  return (
    <div className="lp site">
      <NoScript />
      <PageHero
        eyebrow="Pricing"
        title="Free to make videos. Premium when you want them bigger and unmarked."
        lead="Both plans have every template, every element and all three formats. Premium raises the resolution and the frame rate and removes the watermark."
      />

      <section className="lp-wrap lp-section--tight">
        {justPaid && (
          <Reveal className="pricing-paid">
            <p className="pf-banner" role="status">
              <Check className="pf-i text-success" aria-hidden />
              <span>
                {tier === "PREMIUM" ? (
                  <>
                    <b>Thank you.</b> Your account is on Premium now.
                  </>
                ) : (
                  <>
                    <b>Thank you.</b> Your payment is being confirmed; Premium is switched on
                    within a minute. Reload this page to check.
                  </>
                )}
              </span>
            </p>
          </Reveal>
        )}
        <PlanCards
          priceLabel={process.env.PREMIUM_PRICE_LABEL || undefined}
          premiumAction={premiumAction}
        />
        <CompareTable />
      </section>

      <section className="lp-rule">
        <div className="lp-wrap lp-section">
          <div className="lp-grid">
            <SectionHead className="s5 faq-head" eyebrow="Questions" title="Before you pay." />
            <Reveal className="s7" delay={100}>
              <Faq items={PLAN_QUESTIONS} />
            </Reveal>
          </div>
        </div>
      </section>

      <ClosingCall />
      <SiteFooter />
    </div>
  );
}
