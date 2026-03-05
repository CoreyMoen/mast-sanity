/**
 * payments/index.ts — Payment provider factory.
 *
 * Returns the appropriate PaymentProvider instance based on the
 * provider name. Defaults to Stripe.
 */

import type { PaymentProvider, PaymentProviderName } from "./types";
import { StripePaymentProvider } from "./stripe";
import { ConvergePaymentProvider } from "./converge";

/**
 * Create a payment provider instance by name.
 *
 * @param name - The payment provider to instantiate (default: "stripe")
 * @returns A PaymentProvider implementation
 */
export function createPaymentProvider(
  name: PaymentProviderName = "stripe",
): PaymentProvider {
  switch (name) {
    case "stripe":
      return new StripePaymentProvider();
    case "converge":
      return new ConvergePaymentProvider();
    default:
      throw new Error(`Unknown payment provider: ${name}`);
  }
}

export type { PaymentProvider, PaymentProviderName, CheckoutParams, WebhookEvent } from "./types";
