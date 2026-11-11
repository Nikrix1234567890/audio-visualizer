import { NextResponse } from "next/server";
import { publicOrigin } from "@/lib/origin";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPortalUrl, isStripeConfigured } from "@/lib/stripe";

/**
 * Answers with the address of the Stripe customer portal for the signed-in
 * user, where they change their payment method or cancel the subscription.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!isStripeConfigured() || !user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "There is no subscription to manage." },
      { status: 404 },
    );
  }

  try {
    const url = await createPortalUrl({
      customerId: user.stripeCustomerId,
      returnUrl: `${publicOrigin(request)}/account`,
    });
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Opening the Stripe portal failed:", error);
    return NextResponse.json(
      { error: "The subscription page could not be opened. Try again in a moment." },
      { status: 502 },
    );
  }
}
