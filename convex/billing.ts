/**
 * billing.ts — Stripe subscription and billing logic.
 *
 * Manages subscription tier changes, Stripe checkout session creation,
 * customer portal links, and webhook processing for payment events.
 */

import { v, ConvexError } from "convex/values";
import { action, mutation, internalMutation, internalQuery, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { StripePaymentProvider } from "../lib/payments/stripe";
import { getPriceId } from "../lib/payments/config";
import { TIER_CREDIT_LIMITS } from "./constants";

/**
 * Get the current user's subscription and billing info.
 */
export const getSubscription = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    // Derive AI credit limit from tier (not from potentially stale DB field)
    const tierKey = (user.subscriptionTier ?? "free") as keyof typeof TIER_CREDIT_LIMITS;
    const tierLimit = TIER_CREDIT_LIMITS[tierKey] ?? TIER_CREDIT_LIMITS.free;

    return {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      stripeCustomerId: user.stripeCustomerId ?? null,
      hasStripeAccount: !!user.stripeCustomerId,
      aiCreditsUsed: user.aiCreditsUsed,
      aiCreditsLimit: tierLimit === Infinity ? -1 : tierLimit,
    };
  },
});

/**
 * Create a Stripe Checkout session for upgrading a subscription.
 */
export const createCheckoutSession = action({
  args: {
    tier: v.union(v.literal("pro"), v.literal("business")),
    interval: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const stripe = new StripePaymentProvider();
    const priceId = getPriceId(args.tier, args.interval ?? "monthly");

    const url = await stripe.createCheckoutSession({
      userId: identity.subject,
      email: identity.email ?? "",
      priceId,
      successUrl: args.successUrl,
      cancelUrl: args.cancelUrl,
    });

    return { url };
  },
});

/**
 * Create a Stripe Customer Portal session for managing billing.
 */
export const createPortalSession = action({
  args: { returnUrl: v.string() },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    // Look up the user's Stripe customer ID
    const subscription = await ctx.runQuery(api.billing.getSubscription);
    if (!subscription || !subscription.hasStripeAccount) {
      throw new ConvexError({ code: "NOT_FOUND", message: "No Stripe customer linked to this account. Please subscribe to a plan first." });
    }

    // Fetch the actual stripeCustomerId via internal query (not exposed to client)
    const user = await ctx.runQuery(internal.billing.getStripeCustomerId);
    if (!user) {
      throw new ConvexError({ code: "NOT_FOUND", message: "No Stripe customer linked to this account." });
    }

    const stripe = new StripePaymentProvider();
    const url = await stripe.createBillingPortalSession(user);

    return { url };
  },
});

/**
 * Mutation called by Stripe webhook to update subscription status.
 * Security: The calling Next.js API route verifies the Stripe webhook signature
 * before invoking this mutation.
 */
export const handleSubscriptionUpdate = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("business"),
    ),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
    ),
  },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripeCustomerId", (q: any) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .unique();

    if (!user) {
      console.error(`No user found for Stripe customer: ${args.stripeCustomerId}`);
      return;
    }

    // Update AI credits limit based on tier (derive from TIER_CREDIT_LIMITS)
    const tierKey = args.subscriptionTier as keyof typeof TIER_CREDIT_LIMITS;
    const creditLimit = TIER_CREDIT_LIMITS[tierKey];
    // Convex can't store Infinity, so use a large sentinel for business tier
    const storedLimit = creditLimit === Infinity ? 999999 : creditLimit;

    await ctx.db.patch(user._id, {
      subscriptionTier: args.subscriptionTier,
      subscriptionStatus: args.subscriptionStatus,
      aiCreditsLimit: storedLimit,
    });
  },
});

/**
 * Mutation to link a Stripe customer ID to a Clerk user.
 * Called when checkout.session.completed fires with clerkUserId metadata.
 * Security: The calling Next.js API route verifies the Stripe webhook signature.
 */
export const linkStripeCustomer = internalMutation({
  args: {
    clerkUserId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.clerkUserId))
      .unique();

    if (!user) {
      console.error(`No user found for clerkId: ${args.clerkUserId}`);
      return;
    }

    await ctx.db.patch(user._id, {
      stripeCustomerId: args.stripeCustomerId,
    });
  },
});

/**
 * Internal mutation to reset monthly AI credits (called by cron).
 */
export const resetMonthlyCredits = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (user.subscriptionStatus === "active") {
        await ctx.db.patch(user._id, { aiCreditsUsed: 0 });
      }
    }
  },
});

/**
 * Internal query to fetch the Stripe customer ID for the authenticated user.
 * Used by createPortalSession to avoid exposing the ID to the client.
 */
export const getStripeCustomerId = internalQuery({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    return user.stripeCustomerId ?? null;
  },
});
