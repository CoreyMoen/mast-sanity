/**
 * converge.ts — Converge stub implementation of the PaymentProvider interface.
 *
 * Converge (by Elavon) is a payment gateway that provides hosted checkout,
 * transaction management, and recurring billing. This stub outlines the
 * expected integration points using Converge's REST API.
 *
 * Converge API documentation:
 *   https://developer.elavon.com/na/docs/converge
 *
 * All methods currently throw descriptive errors. Replace the stubs with
 * real API calls when the Converge integration is ready.
 */

import type { PaymentProvider, CheckoutParams, WebhookEvent } from "./types";

// ─── Converge API Types ──────────────────────────────────────────────────────
// These interfaces represent the expected request/response shapes for
// Converge API calls. Update these once the actual API contract is confirmed.

/** Request body for creating a Converge hosted checkout session. */
export interface ConvergeCheckoutRequest {
  /** Merchant ID assigned by Converge */
  merchantId: string;
  /** Converge API user ID */
  userId: string;
  /** PIN or API key for authentication */
  pin: string;
  /** Transaction type — "ccsale" for one-time, "ccaddrecurring" for subscriptions */
  transactionType: "ccsale" | "ccaddrecurring";
  /** Total amount in decimal format (e.g., "19.00") */
  amount: string;
  /** Currency code (e.g., "USD") */
  currencyCode: string;
  /** Customer email address */
  customerEmail: string;
  /** URL to redirect the customer to after successful payment */
  resultUrl: string;
  /** URL to redirect the customer to if they cancel */
  cancelUrl: string;
  /** Custom reference fields for tracking (e.g., Clerk user ID) */
  customFields?: Record<string, string>;
}

/** Response from creating a Converge hosted checkout session. */
export interface ConvergeCheckoutResponse {
  /** The token/session ID for the hosted payment page */
  sessionToken: string;
  /** The full URL to redirect the customer to for hosted checkout */
  checkoutUrl: string;
}

/** Converge transaction record returned by the reporting API. */
export interface ConvergeTransaction {
  /** Converge transaction ID */
  transactionId: string;
  /** Transaction status (e.g., "Settled", "Authorized", "Declined") */
  status: string;
  /** Amount in decimal format */
  amount: string;
  /** Currency code */
  currencyCode: string;
  /** Transaction timestamp */
  transactionDate: string;
  /** Card type (Visa, Mastercard, etc.) */
  cardType?: string;
  /** Last four digits of the card */
  cardLastFour?: string;
}

/** Converge recurring billing record. */
export interface ConvergeRecurringProfile {
  /** Recurring profile ID */
  profileId: string;
  /** Profile status (Active, Suspended, Expired) */
  status: "Active" | "Suspended" | "Expired";
  /** Billing amount per interval */
  amount: string;
  /** Billing frequency (Monthly, Yearly, etc.) */
  billingCycle: string;
  /** Next scheduled billing date */
  nextBillingDate: string;
}

/** Converge webhook/callback payload. */
export interface ConvergeWebhookPayload {
  /** Event type identifier */
  eventType: string;
  /** Transaction or profile ID */
  referenceId: string;
  /** Transaction status */
  status: string;
  /** Amount if applicable */
  amount?: string;
  /** Timestamp of the event */
  timestamp: string;
  /** Signature hash for verification */
  signatureHash: string;
}

// ─── Converge Payment Provider ───────────────────────────────────────────────

export class ConvergePaymentProvider implements PaymentProvider {
  /**
   * Create a Converge hosted checkout session for a new subscription.
   *
   * TODO: Implementation steps:
   * 1. Authenticate with Converge using merchant credentials
   *    (CONVERGE_MERCHANT_ID, CONVERGE_USER_ID, CONVERGE_PIN)
   * 2. Call the Converge "ccaddrecurring" transaction type to set up
   *    a recurring billing profile
   * 3. Use the hosted payment page token to build the checkout URL
   * 4. Store the Clerk userId in custom fields for webhook reconciliation
   *
   * Converge API endpoint: POST https://api.convergepay.com/hosted-payments/transaction_token
   */
  async createCheckoutSession(_params: CheckoutParams): Promise<string> {
    // TODO: Build ConvergeCheckoutRequest from params
    // TODO: POST to Converge hosted payments API
    // TODO: Return the hosted checkout URL from the response
    throw new Error(
      "Converge createCheckoutSession is not yet implemented. " +
        "Configure CONVERGE_MERCHANT_ID, CONVERGE_USER_ID, and CONVERGE_PIN " +
        "environment variables, then implement the hosted checkout flow.",
    );
  }

  /**
   * Create a self-service billing management session.
   *
   * TODO: Implementation steps:
   * 1. Converge does not have a native billing portal like Stripe.
   *    Options:
   *    a) Build a custom billing management page using the Converge
   *       reporting API to fetch transaction history and the recurring
   *       billing API to manage subscriptions.
   *    b) Redirect to a custom-built portal page in the app that
   *       calls Converge APIs on the backend.
   * 2. Return the URL to the custom billing management page.
   *
   * Converge API endpoint: POST https://api.convergepay.com/VirtualMerchant/processxml.do
   *   (for querying recurring profiles and transaction history)
   */
  async createBillingPortalSession(_customerId: string): Promise<string> {
    // TODO: Since Converge lacks a hosted portal, build a custom page
    // TODO: Return URL to the custom billing management page
    throw new Error(
      "Converge createBillingPortalSession is not yet implemented. " +
        "Converge does not provide a hosted billing portal. " +
        "A custom billing management UI needs to be built.",
    );
  }

  /**
   * Verify and parse a Converge webhook callback.
   *
   * TODO: Implementation steps:
   * 1. Read the callback payload from the request body
   * 2. Verify the signature hash using the shared secret
   *    (CONVERGE_WEBHOOK_SECRET)
   * 3. Parse the payload into a normalized WebhookEvent
   * 4. Map Converge event types to our internal event types:
   *    - "transaction_approved" -> "checkout.completed"
   *    - "recurring_payment" -> "subscription.renewed"
   *    - "recurring_suspended" -> "subscription.canceled"
   *    - "transaction_declined" -> "payment.failed"
   *
   * Converge callback URL: configured in Converge merchant portal
   */
  async handleWebhook(_request: Request): Promise<WebhookEvent> {
    // TODO: Read and parse the request body
    // TODO: Verify the signature hash
    // TODO: Map Converge event types to normalized WebhookEvent
    throw new Error(
      "Converge handleWebhook is not yet implemented. " +
        "Configure the webhook callback URL in the Converge merchant portal " +
        "and set CONVERGE_WEBHOOK_SECRET.",
    );
  }

  /**
   * Cancel an active recurring billing profile.
   *
   * TODO: Implementation steps:
   * 1. Authenticate with Converge merchant credentials
   * 2. Call the "ccupdaterecurring" transaction type with
   *    ssl_delete_token set to suspend/cancel the profile
   * 3. The profile will stop billing but remain in the system
   *    for record-keeping
   *
   * Converge API endpoint: POST https://api.convergepay.com/VirtualMerchant/processxml.do
   *   with ssl_transaction_type=ccupdaterecurring
   */
  async cancelSubscription(_subscriptionId: string): Promise<void> {
    // TODO: POST to Converge with ccupdaterecurring to suspend the profile
    throw new Error(
      "Converge cancelSubscription is not yet implemented. " +
        "Use the ccupdaterecurring transaction type to suspend the " +
        "recurring billing profile.",
    );
  }
}
