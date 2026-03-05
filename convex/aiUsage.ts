/**
 * aiUsage.ts — AI usage tracking and credit metering.
 *
 * Provides queries for usage summaries and credit availability,
 * plus an internal mutation for logging usage events.
 * Works alongside ai.ts which handles the actual LLM calls.
 */

import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { TIER_CREDIT_LIMITS } from "./constants";

/**
 * Get a summary of the current user's AI usage for the current billing month.
 * Returns total count, breakdown by type, tier limit, and reset date.
 */
export const getUsageSummary = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    // Calculate start of current billing month (1st of current month, midnight UTC)
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    // Fetch all usage logs for this user in the current month
    const logs = await ctx.db
      .query("aiUsageLog")
      .withIndex("by_userId_createdAt", (q: any) =>
        q.eq("userId", user._id).gte("createdAt", monthStart.getTime()),
      )
      .collect();

    // Break down by action type
    const breakdown = {
      generate: 0,
      rewrite: 0,
      hashtags: 0,
    };

    for (const log of logs) {
      if (log.action in breakdown) {
        breakdown[log.action as keyof typeof breakdown] += 1;
      }
    }

    const totalUsed = breakdown.generate + breakdown.rewrite + breakdown.hashtags;
    const tierLimit =
      TIER_CREDIT_LIMITS[
        user.subscriptionTier as keyof typeof TIER_CREDIT_LIMITS
      ] ?? TIER_CREDIT_LIMITS.free;
    const isUnlimited = tierLimit === Infinity;

    return {
      totalUsed,
      limit: isUnlimited ? -1 : tierLimit,
      tierLimit: isUnlimited ? -1 : tierLimit,
      isUnlimited,
      breakdown,
      resetDate: nextMonthStart.getTime(),
      tier: user.subscriptionTier,
      provider: user.llmProvider,
    };
  },
});

/**
 * Check whether the current user has AI credits remaining.
 * Returns true if credits are available, false if exhausted.
 */
export const checkCreditsAvailable = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return false;

    // Derive limit from tier (not from DB field)
    const tierLimit =
      TIER_CREDIT_LIMITS[
        user.subscriptionTier as keyof typeof TIER_CREDIT_LIMITS
      ] ?? TIER_CREDIT_LIMITS.free;

    if (tierLimit === Infinity) return true;
    return user.aiCreditsUsed < tierLimit;
  },
});

/**
 * Internal mutation to record an AI usage event.
 * Called by ai.ts actions after a successful generation.
 * Inserts a log entry and increments the user's credit counter.
 */
export const logUsage = internalMutation({
  args: {
    userId: v.id("users"),
    action: v.union(
      v.literal("generate"),
      v.literal("rewrite"),
      v.literal("hashtags"),
    ),
    provider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("anthropic"),
    ),
    inputTokens: v.number(),
    outputTokens: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    // Insert the usage log
    await ctx.db.insert("aiUsageLog", {
      userId: args.userId,
      action: args.action,
      provider: args.provider,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      createdAt: Date.now(),
    });

    // Increment the user's running credit counter
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        aiCreditsUsed: user.aiCreditsUsed + 1,
      });
    }
  },
});
