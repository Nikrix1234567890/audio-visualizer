import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readWebhookEvent } from "@/lib/stripe";

/** Subscription states in which the customer has what they pay for. */
const PAID_STATES = ["active", "trialing"];

/**
 * Stripe calls this when a payment went through or a subscription changed.
 * It is the only place where the plan of an account changes because of
 * money, and it acts only on requests that carry a valid Stripe signature.
 */
export async function POST(request: Request) {
  // The signature covers the exact bytes, so read the body as text.
  const rawBody = await request.text();
  const event = readWebhookEvent(rawBody, request.headers.get("stripe-signature"));
  if (!event) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const object = event.data.object;
  const customerId = typeof object.customer === "string" ? object.customer : null;

  if (event.type === "checkout.session.completed") {
    // Paid: the account that started the checkout becomes Premium, and
    // remembers its Stripe customer for later subscription events.
    const userId =
      typeof object.client_reference_id === "string"
        ? object.client_reference_id
        : null;
    if (userId) {
      await prisma.user.updateMany({
        where: { id: userId },
        data: { tier: "PREMIUM", stripeCustomerId: customerId },
      });
    }
  } else if (
    customerId &&
    (event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted")
  ) {
    const isPaid =
      event.type === "customer.subscription.updated" &&
      PAID_STATES.includes(String(object.status));
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: { tier: isPaid ? "PREMIUM" : "FREE" },
    });
  }

  // Anything else is acknowledged and ignored, so Stripe does not retry it.
  return NextResponse.json({ received: true });
}
