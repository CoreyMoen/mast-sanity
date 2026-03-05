/**
 * config.ts — Payment provider configuration and plan metadata.
 *
 * Centralizes provider selection, price ID mappings, and plan metadata
 * so that switching payment providers is as simple as changing the
 * PAYMENT_PROVIDER environment variable.
 */

import type { PaymentProviderName } from "./types";

// ─── Plan and interval types ─────────────────────────────────────────────────

export type PlanTier = "free" | "pro" | "business";
export type BillingInterval = "monthly" | "yearly";

export interface PlanMetadata {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

export interface PriceIdMap {
  pro: { monthly: string; yearly: string };
  business: { monthly: string; yearly: string };
}

export interface PaymentConfig {
  provider: PaymentProviderName;
  prices: PriceIdMap;
  /** The public key used by the client SDK (e.g., Stripe publishable key) */
  publicKey: string;
}

// ─── Plan metadata ───────────────────────────────────────────────────────────
// Shared across all providers — defines what each tier includes.

export const PLAN_METADATA: Record<PlanTier, PlanMetadata> = {
  free: {
    name: "Free",
    description: "Get started with basic scheduling",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "1 connected account",
      "10 scheduled posts/mo",
      "1 team member",
      "10 AI credits/mo",
      "7-day analytics",
    ],
  },
  pro: {
    name: "Pro",
    description: "For creators and small teams",
    monthlyPrice: 19,
    yearlyPrice: 190,
    features: [
      "10 connected accounts",
      "Unlimited scheduled posts",
      "3 team members",
      "100 AI credits/mo",
      "90-day analytics",
      "Approval workflows",
      "Recurring posts",
    ],
  },
  business: {
    name: "Business",
    description: "For agencies and growing teams",
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      "25 connected accounts",
      "Unlimited scheduled posts",
      "15 team members",
      "Unlimited AI credits",
      "365-day analytics",
      "Approval workflows",
      "Recurring posts",
      "Priority support",
      "Custom branding",
    ],
  },
};

// ─── Provider-specific price ID maps ─────────────────────────────────────────

function getStripePrices(): PriceIdMap {
  return {
    pro: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
    },
    business: {
      monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ?? "",
      yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID ?? "",
    },
  };
}

function getConvergePrices(): PriceIdMap {
  return {
    pro: {
      monthly: process.env.CONVERGE_PRO_MONTHLY_PRICE_ID ?? "",
      yearly: process.env.CONVERGE_PRO_YEARLY_PRICE_ID ?? "",
    },
    business: {
      monthly: process.env.CONVERGE_BUSINESS_MONTHLY_PRICE_ID ?? "",
      yearly: process.env.CONVERGE_BUSINESS_YEARLY_PRICE_ID ?? "",
    },
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the active payment provider name from the environment.
 * Defaults to "stripe" if PAYMENT_PROVIDER is not set.
 */
export function getActivePaymentProvider(): PaymentProviderName {
  const provider = process.env.PAYMENT_PROVIDER ?? "stripe";
  if (provider !== "stripe" && provider !== "converge") {
    throw new Error(
      `Invalid PAYMENT_PROVIDER "${provider}". Expected "stripe" or "converge".`,
    );
  }
  return provider;
}

/**
 * Returns the full payment configuration for the active provider,
 * including price ID mappings and the public key for client-side use.
 */
export function getPaymentConfig(): PaymentConfig {
  const provider = getActivePaymentProvider();

  switch (provider) {
    case "stripe":
      return {
        provider,
        prices: getStripePrices(),
        publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
      };
    case "converge":
      return {
        provider,
        prices: getConvergePrices(),
        publicKey: process.env.NEXT_PUBLIC_CONVERGE_PUBLIC_KEY ?? "",
      };
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

/**
 * Resolve a plan tier and billing interval to a concrete price ID
 * for the active payment provider.
 */
export function getPriceId(
  tier: "pro" | "business",
  interval: BillingInterval = "monthly",
): string {
  const config = getPaymentConfig();
  const priceId = config.prices[tier][interval];
  if (!priceId) {
    throw new Error(
      `No price ID configured for ${tier}/${interval} on ${config.provider}. ` +
        `Set the appropriate environment variable.`,
    );
  }
  return priceId;
}
