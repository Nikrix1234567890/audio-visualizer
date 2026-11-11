import Link from "next/link";
import type { ReactNode } from "react";
import { TIER_LIMITS, type TierName } from "@/lib/tiers";
import { RESOLUTIONS } from "../../remotion/types";

function planFeatures(tier: TierName): string[] {
  const limits = TIER_LIMITS[tier];
  return [
    `Export up to ${RESOLUTIONS[limits.maxResolution].label}`,
    `${limits.frameRates.join(" and ")} frames per second`,
    limits.watermark ? "Small watermark in a corner" : "No watermark",
    "All templates and elements",
    "Landscape, portrait and square",
    "Your own pictures and 3D models",
  ];
}

/**
 * The two plans side by side, built from the same limits the render route
 * enforces - so this can never promise something else. `premiumAction` is
 * what sits under the Premium plan (the upgrade button on the pricing
 * page); without it the card links to that page.
 */
export function PlanCards({
  priceLabel,
  premiumAction,
}: {
  /** What Premium costs, e.g. "9 EUR / month". Left out until a price is set. */
  priceLabel?: string;
  premiumAction?: ReactNode;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Plan
        name="Free"
        price="0"
        note="No account needed"
        features={planFeatures("FREE")}
        action={
          <Link
            href="/editor"
            className="rounded-xl border border-hairline bg-panel-raised px-5 py-2.5 text-center text-sm font-semibold tracking-wide text-cream shadow-control-raised outline-none hover:border-amber-dim hover:text-amber focus-visible:border-amber"
          >
            Open the editor
          </Link>
        }
      />
      <Plan
        name="Premium"
        price={priceLabel ?? "Price to be announced"}
        note="For finished releases"
        features={planFeatures("PREMIUM")}
        isHighlighted
        action={
          premiumAction ?? (
            <Link
              href="/pricing"
              className="rounded-xl bg-amber px-5 py-2.5 text-center text-sm font-semibold tracking-wide text-chassis outline-none hover:bg-amber/90 focus-visible:ring-2 focus-visible:ring-cream"
            >
              See Premium
            </Link>
          )
        }
      />
    </div>
  );
}

function Plan({
  name,
  price,
  note,
  features,
  action,
  isHighlighted = false,
}: {
  name: string;
  price: string;
  note: string;
  features: string[];
  action: ReactNode;
  isHighlighted?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-5 rounded-[10px] border bg-panel p-6 ${
        isHighlighted ? "border-amber-dim" : "border-hairline"
      }`}
    >
      <div className="flex flex-col gap-1">
        <span
          className={`font-mono text-[11px] tracking-[0.12em] uppercase ${
            isHighlighted ? "text-amber" : "text-steel"
          }`}
        >
          {name}
        </span>
        <span className="text-2xl font-semibold tracking-tight text-cream">
          {price}
        </span>
        <span className="text-xs text-steel">{note}</span>
      </div>
      <ul className="flex flex-1 flex-col gap-2 text-sm text-cream">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span
              aria-hidden
              className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${
                isHighlighted ? "bg-amber" : "bg-amber-dim"
              }`}
            />
            {feature}
          </li>
        ))}
      </ul>
      {action}
    </div>
  );
}
