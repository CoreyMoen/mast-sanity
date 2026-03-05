export interface CheckoutParams {
  /** Clerk user ID */
  userId: string;
  /** Email for the customer */
  email: string;
  /** Price/plan identifier */
  priceId: string;
  /** URL to redirect to on success */
  successUrl: string;
  /** URL to redirect to on cancel */
  cancelUrl: string;
}

export interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface PaymentProvider {
  /** Create a checkout session and return the checkout URL */
  createCheckoutSession(params: CheckoutParams): Promise<string>;
  /** Create a billing portal session and return the portal URL */
  createBillingPortalSession(customerId: string): Promise<string>;
  /** Verify and parse a webhook request */
  handleWebhook(request: Request): Promise<WebhookEvent>;
  /** Cancel an active subscription */
  cancelSubscription(subscriptionId: string): Promise<void>;
}

export type PaymentProviderName = "stripe" | "converge";
