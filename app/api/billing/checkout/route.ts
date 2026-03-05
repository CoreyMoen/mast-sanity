/**
 * POST /api/billing/checkout
 *
 * Creates a checkout session using the active payment provider.
 * Accepts a priceId and optional plan tier in the request body,
 * authenticates the user via Clerk, and returns the provider's
 * checkout URL for redirection.
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createPaymentProvider } from "@/lib/payments";
import { getActivePaymentProvider } from "@/lib/payments/config";

export async function POST(request: Request) {
  // ── Authenticate the request ─────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  // ── Parse and validate the request body ──────────────────────────────────
  let body: { priceId?: string; tier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const { priceId } = body;

  if (!priceId || typeof priceId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid priceId" },
      { status: 400 },
    );
  }

  // ── Resolve the user's email ─────────────────────────────────────────────
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    return NextResponse.json(
      { error: "User does not have an email address" },
      { status: 400 },
    );
  }

  // ── Create the checkout session ──────────────────────────────────────────
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const provider = createPaymentProvider(getActivePaymentProvider());
    const checkoutUrl = await provider.createCheckoutSession({
      userId,
      email,
      priceId,
      successUrl: `${appUrl}/dashboard/settings?upgraded=true`,
      cancelUrl: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    console.error("Checkout session creation failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
