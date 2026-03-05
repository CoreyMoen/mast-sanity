/**
 * constants.ts — Shared constants for Convex functions.
 *
 * Keeps tier limits and other config in a single place
 * so they can be referenced from multiple Convex modules.
 */

/** AI credit limits per subscription tier (per month). */
export const TIER_CREDIT_LIMITS = {
  free: 10,
  pro: 100,
  business: Infinity,
} as const;

/** Default LLM model names per provider. */
export const PROVIDER_MODELS = {
  gemini: "Gemini 2.5 Flash Lite",
  openai: "GPT-4o Mini",
  anthropic: "Claude 3.5 Haiku",
} as const;
