import Link from "next/link";
import { auth } from "@/auth";
import { PlanCards } from "@/components/PlanCards";
import { SiteFooter } from "@/components/SiteFooter";
import { UpgradeButton } from "@/components/UpgradeButton";
import { isStripeConfigured } from "@/lib/stripe";
import { getTier } from "@/lib/userTier";
import { BRAND } from "../../../remotion/brand";

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const brandButton =
  "rounded-xl bg-brand px-5 py-2.5 text-center text-sm font-semibold tracking-wide text-canvas outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ink";
const note =
  "rounded-xl border border-line px-5 py-2.5 text-center text-sm text-muted";

const QUESTIONS = [
  {
    question: "What does the watermark look like?",
    answer:
      `A small “${BRAND.name}” in the bottom right corner. The editor preview shows it exactly where the video will have it.`,
  },
  {
    question: "Do I keep my projects on the free plan?",
    answer:
      "Yes. Projects, your own templates and your videos stay in your account on both plans.",
  },
  {
    question: "How is the payment handled?",
    answer:
      "By Stripe, on a page run by Stripe. Card details never reach this site.",
  },
  {
    question: "What happens when Premium ends?",
    answer:
      "The account goes back to the free plan. Nothing is deleted; projects set to a higher resolution render at 720p until you upgrade again.",
  },
];

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
      <p className={note}>You are on Premium.</p>
    ) : !isStripeConfigured() ? (
      <p className={note}>Premium is not on sale yet.</p>
    ) : !userId ? (
      <Link href="/login?callbackUrl=/pricing" className={brandButton}>
        Log in to go Premium
      </Link>
    ) : (
      <UpgradeButton />
    );

  return (
    <div className="flex flex-1 flex-col">
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-14">
      <div className="flex flex-col gap-3">
        <span className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
          Pricing
        </span>
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-ink">
          Free to make videos. Premium when you want them bigger and
          unmarked.
        </h1>
      </div>

      {justPaid && (
        <p className="rounded-2xl border border-accent-dim bg-surface px-5 py-4 text-sm text-ink">
          {tier === "PREMIUM"
            ? "Thank you - your account is on Premium now."
            : "Thank you. Your payment is being confirmed; Premium is switched on within a minute. Reload this page to check."}
        </p>
      )}

      <PlanCards
        priceLabel={process.env.PREMIUM_PRICE_LABEL || undefined}
        premiumAction={premiumAction}
      />

      <dl className="grid gap-x-10 gap-y-6 text-sm md:grid-cols-2">
        {QUESTIONS.map(({ question, answer }) => (
          <div
            key={question}
            className="flex flex-col gap-1.5 border-t border-line pt-4"
          >
            <dt className="font-semibold text-ink">{question}</dt>
            <dd className="leading-relaxed text-muted">{answer}</dd>
          </div>
        ))}
      </dl>
    </div>
    <SiteFooter />
    </div>
  );
}
