import { LegalPage } from "@/components/LegalPage";
import { TIER_LIMITS } from "@/lib/tiers";
import { BRAND } from "../../../../remotion/brand";
import { RESOLUTIONS } from "../../../../remotion/types";

export const metadata = { title: `Terms - ${BRAND.name}` };

/**
 * The terms of use. The outline covers what a service like this usually
 * needs to settle; the wording has to be written and checked by a lawyer.
 * The plan limits are read from the code, so they cannot drift apart.
 */
export default function TermsPage() {
  const free = TIER_LIMITS.FREE;
  const premium = TIER_LIMITS.PREMIUM;

  return (
    <LegalPage title="Terms of use">
      <section>
        <h2>1. The service</h2>
        <p>
          {BRAND.name} lets you turn an audio track into a video in your
          browser. The Free plan exports up to{" "}
          {RESOLUTIONS[free.maxResolution].label} at{" "}
          {free.frameRates.join(" / ")} frames per second with a watermark;
          the Premium plan up to {RESOLUTIONS[premium.maxResolution].label} at{" "}
          {premium.frameRates.join(" / ")} frames per second without one.
        </p>
      </section>
      <section>
        <h2>2. Your content</h2>
        <p>
          [To be written: you keep all rights to your music, pictures and
          models; you confirm that you are allowed to use them; you grant
          only the permission needed to store them and render your videos.]
        </p>
      </section>
      <section>
        <h2>3. The videos you make</h2>
        <p>
          [To be written: whether videos may be used commercially on each
          plan, and what the watermark on the Free plan means for that.]
        </p>
      </section>
      <section>
        <h2>4. Premium: price, payment, cancelling</h2>
        <p>
          [To be written: price and billing period, renewal, how to cancel
          (through &quot;Manage subscription&quot; on the account page), the
          statutory right of withdrawal for consumers and when it ends for
          digital services.]
        </p>
      </section>
      <section>
        <h2>5. What is not allowed</h2>
        <p>
          [To be written: unlawful content, content that infringes the
          rights of others, attempts to overload or attack the service.]
        </p>
      </section>
      <section>
        <h2>6. Availability and liability</h2>
        <p>[To be written.]</p>
      </section>
      <section>
        <h2>7. Ending the account</h2>
        <p>
          You can delete your account on the account page at any time. [To be
          written: when the provider may close an account.]
        </p>
      </section>
      <section>
        <h2>8. Changes, applicable law</h2>
        <p>[To be written.]</p>
      </section>
    </LegalPage>
  );
}
