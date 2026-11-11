import { NextResponse } from "next/server";
import { publicOrigin } from "@/lib/origin";
import { auth } from "@/auth";
import { createCheckoutUrl, isStripeConfigured } from "@/lib/stripe";

/** Starts the payment for Premium and answers with the address of the payment page. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in to upgrade." }, { status: 401 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not available yet." },
      { status: 503 },
    );
  }

  try {
    const url = await createCheckoutUrl({
      userId: session.user.id,
      email: session.user.email ?? null,
      origin: publicOrigin(request),
    });
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Starting the Stripe checkout failed:", error);
    return NextResponse.json(
      { error: "The payment could not be started. Try again in a moment." },
      { status: 502 },
    );
  }
}
