/**
 * POST /api/billing/portal
 *
 * Creates a billing portal session using the active payment provider.
 * Retrieves the customer ID from the request body (which the client
 * obtains from Convex) and returns the portal URL for redirection.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createPaymentProvider } from "@/lib/payments";
import { getActivePaymentProvider } from "@/lib/payments/config";

export async function POST(request: Request) {
  // ── Authenticate the request ─────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ── Parse and validate the request body ──────────────────────────────────
  let body: { customerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const { customerId } = body;

  if (!customerId || typeof customerId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid customerId" },
      { status: 400 },
    );
  }

  // ── Create the billing portal session ────────────────────────────────────
  try {
    const provider = createPaymentProvider(getActivePaymentProvider());
    const portalUrl = await provider.createBillingPortalSession(customerId);

    return NextResponse.json({ url: portalUrl });
  } catch (err) {
    console.error("Billing portal session creation failed:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Failed to create billing portal session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
