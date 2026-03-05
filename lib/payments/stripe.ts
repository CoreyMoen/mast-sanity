/**
 * stripe.ts — Stripe implementation of the PaymentProvider interface.
 *
 * Handles checkout session creation, billing portal management,
 * webhook signature verification, and subscription cancellation.
 */

import Stripe from "stripe";
import type { PaymentProvider, CheckoutParams, WebhookEvent } from "./types";

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  return new Stripe(key);
}

export class StripePaymentProvider implements PaymentProvider {
  /**
   * Create a Stripe Checkout session for a new subscription.
   * Returns the checkout URL to redirect the user to.
   */
  async createCheckoutSession(params: CheckoutParams): Promise<string> {
    const session = await getStripeClient().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.email,
      metadata: {
        clerkUserId: params.userId,
      },
      subscription_data: {
        metadata: {
          clerkUserId: params.userId,
        },
      },
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session URL");
    }

    return session.url;
  }

  /**
   * Create a Stripe Billing Portal session for subscription management.
   * Returns the portal URL to redirect the user to.
   */
  async createBillingPortalSession(customerId: string): Promise<string> {
    const session = await getStripeClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/settings`,
    });

    return session.url;
  }

  /**
   * Verify the webhook signature and return a normalized event.
   */
  async handleWebhook(request: Request): Promise<WebhookEvent> {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    const event = getStripeClient().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    return {
      type: event.type,
      data: event.data.object as unknown as Record<string, unknown>,
    };
  }

  /**
   * Cancel a subscription gracefully at the end of the current billing period.
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await getStripeClient().subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
}
