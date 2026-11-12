import { Check, Crown } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { TIER_LIMITS, type TierName } from "@/lib/tiers";
import { Stagger, StaggerItem } from "@/components/site/kit";
import { RESOLUTIONS } from "../../remotion/types";

function planFeatures(tier: TierName): string[] {
  const limits = TIER_LIMITS[tier];
  const top = `Export up to ${RESOLUTIONS[limits.maxResolution].label} at ${Math.max(...limits.frameRates)} fps`;
  return tier === "FREE"
    ? [
        top,
        "All templates and elements",
        "Landscape, portrait and square",
        "Your own pictures and 3D models",
        limits.watermark ? "Small watermark in the corner" : "No watermark",
      ]
    : [
        top,
        limits.watermark ? "Small watermark in the corner" : "No watermark",
        "Everything in Free",
        "Cancel any time in the customer portal",
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
    <Stagger className="lp-grid" gap={0.1}>
      <StaggerItem className="pf-price s6">
        <span className="pf-price__name">Free</span>
        <span className="pf-price__amount">
          €0<small>no account needed</small>
        </span>
        <FeatureList features={planFeatures("FREE")} />
        <Link href="/editor" className="pf-btn pf-btn--secondary pf-btn--lg pf-btn--block mt-auto">
          Open the editor
        </Link>
      </StaggerItem>
      <StaggerItem className="pf-price pf-price--featured s6">
        <span className="pf-price__name">
          Premium
          <span className="pf-badge pf-badge--premium">
            <Crown className="pf-i" aria-hidden />
            Best quality
          </span>
        </span>
        {priceLabel ? (
          <span className="pf-price__amount">{priceLabel}</span>
        ) : (
          <span className="pf-price__amount price-open">Price to be announced</span>
        )}
        <FeatureList features={planFeatures("PREMIUM")} />
        <div className="mt-auto">
          {premiumAction ?? (
            <Link href="/pricing" className="pf-btn pf-btn--cta pf-btn--lg pf-btn--block">
              See Premium
            </Link>
          )}
        </div>
      </StaggerItem>
    </Stagger>
  );
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="pf-price__list">
      {features.map((feature) => (
        <li key={feature}>
          <Check className="pf-i" aria-hidden />
          {feature}
        </li>
      ))}
    </ul>
  );
}
