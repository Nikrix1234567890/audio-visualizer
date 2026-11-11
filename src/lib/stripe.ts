import { createHmac, timingSafeEqual } from "node:crypto";

// Payments through Stripe, without Stripe's SDK: the two things needed -
// starting a Checkout session and checking a webhook's signature - are one
// HTTPS call and one HMAC.
//
// Nothing here works until these are set in .env (see .env.example):
//   STRIPE_SECRET_KEY      secret API key (sk_test_... while testing)
//   STRIPE_PRICE_ID        the recurring price of the Premium plan (price_...)
//   STRIPE_WEBHOOK_SECRET  signing secret of the webhook endpoint (whsec_...)
// Until then the pricing page says that payments are not available yet.

const STRIPE_API = "https://api.stripe.com/v1";
/** A webhook older than this is refused - it could be a replayed request. */
const WEBHOOK_TOLERANCE_SECONDS = 300;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

/**
 * Starts a Stripe Checkout for the Premium subscription and returns the
 * address of Stripe's payment page. `userId` comes back in the webhook as
 * `client_reference_id`, which is how the payment finds its account.
 */
export async function createCheckoutUrl({
  userId,
  email,
  origin,
}: {
  userId: string;
  email: string | null;
  origin: string;
}): Promise<string> {
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": process.env.STRIPE_PRICE_ID ?? "",
    "line_items[0][quantity]": "1",
    client_reference_id: userId,
    success_url: `${origin}/pricing?paid=1`,
    cancel_url: `${origin}/pricing`,
  });
  if (email) body.set("customer_email", email);

  const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.url !== "string") {
    throw new Error(data?.error?.message || "Stripe did not start the payment.");
  }
  return data.url;
}

export type StripeEvent = {
  type: string;
  data: { object: Record<string, unknown> };
};

/**
 * Checks that a webhook really comes from Stripe (its `Stripe-Signature`
 * header signs the timestamp and the raw body with the endpoint's secret)
 * and returns the event, or null if it does not check out.
 */
export function readWebhookEvent(
  rawBody: string,
  signatureHeader: string | null,
  now = Date.now(),
): StripeEvent | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return null;

  let timestamp = "";
  const signatures: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value ?? "";
    if (key === "v1" && value) signatures.push(value);
  }
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds)) return null;
  if (Math.abs(now / 1000 - seconds) > WEBHOOK_TOLERANCE_SECONDS) return null;

  const expected = Buffer.from(
    createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex"),
  );
  const matches = signatures.some((signature) => {
    const given = Buffer.from(signature);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  if (!matches) return null;

  try {
    const event = JSON.parse(rawBody);
    return typeof event?.type === "string" && event?.data?.object ? event : null;
  } catch {
    return null;
  }
}
