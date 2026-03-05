/**
 * rateLimits.ts — Convex-based rate limiting.
 *
 * Provides persistent, server-side rate limiting using Convex documents.
 * Uses a simple sliding-window approach: each rate limit key tracks
 * a request count and a window start timestamp. When the window expires,
 * the counter resets.
 *
 * Prefer this over the in-memory rate limiter (lib/rate-limit.ts) for
 * serverless environments where instance state is ephemeral.
 */

import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// ─── Default window configurations ─────────────────────────────────────────

const DEFAULT_CONFIGS: Record<string, { maxRequests: number; windowMs: number }> = {
  publishing: { maxRequests: 10, windowMs: 60_000 },
  ai: { maxRequests: 20, windowMs: 60_000 },
  oauth: { maxRequests: 5, windowMs: 60_000 },
};

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Check if a rate limit has been exceeded and, if not, increment the counter.
 *
 * @param key - Unique rate limit key, e.g., "publishing:user_abc123"
 * @param category - One of the preset categories ("publishing", "ai", "oauth")
 *                   or omit to use custom maxRequests/windowMs.
 * @param maxRequests - Custom max requests (overrides category default)
 * @param windowMs - Custom window duration in ms (overrides category default)
 *
 * Returns `{ allowed, remainingRequests, resetAt }`.
 */
export const checkAndIncrement = internalMutation({
  args: {
    key: v.string(),
    category: v.optional(v.string()),
    maxRequests: v.optional(v.number()),
    windowMs: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();

    // Resolve config: explicit args > category defaults > fallback
    const categoryConfig = args.category
      ? DEFAULT_CONFIGS[args.category]
      : undefined;
    const maxRequests =
      args.maxRequests ?? categoryConfig?.maxRequests ?? 10;
    const windowMs =
      args.windowMs ?? categoryConfig?.windowMs ?? 60_000;

    // Look up existing counter
    const existing = await ctx.db
      .query("rateLimitCounters")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .unique();

    if (existing) {
      // Check if the window has expired
      const windowExpired = now - existing.windowStart >= existing.windowMs;

      if (windowExpired) {
        // Reset the window and start fresh
        await ctx.db.patch(existing._id, {
          count: 1,
          windowStart: now,
          windowMs,
        });
        return {
          allowed: true,
          remainingRequests: maxRequests - 1,
          resetAt: now + windowMs,
        };
      }

      // Window is still active — check the count
      if (existing.count >= maxRequests) {
        const resetAt = existing.windowStart + existing.windowMs;
        return {
          allowed: false,
          remainingRequests: 0,
          resetAt,
        };
      }

      // Increment the counter
      const newCount = existing.count + 1;
      await ctx.db.patch(existing._id, { count: newCount });

      return {
        allowed: true,
        remainingRequests: maxRequests - newCount,
        resetAt: existing.windowStart + existing.windowMs,
      };
    }

    // No existing counter — create one
    await ctx.db.insert("rateLimitCounters", {
      key: args.key,
      count: 1,
      windowStart: now,
      windowMs,
    });

    return {
      allowed: true,
      remainingRequests: maxRequests - 1,
      resetAt: now + windowMs,
    };
  },
});

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Get the remaining requests for a given rate limit key without
 * incrementing the counter. Useful for UI display (e.g., showing
 * remaining API calls to the user).
 */
export const getRemainingRequests = query({
  args: {
    key: v.string(),
    category: v.optional(v.string()),
    maxRequests: v.optional(v.number()),
    windowMs: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();

    const categoryConfig = args.category
      ? DEFAULT_CONFIGS[args.category]
      : undefined;
    const maxRequests =
      args.maxRequests ?? categoryConfig?.maxRequests ?? 10;
    const windowMs =
      args.windowMs ?? categoryConfig?.windowMs ?? 60_000;

    const existing = await ctx.db
      .query("rateLimitCounters")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .unique();

    if (!existing) {
      return {
        remainingRequests: maxRequests,
        resetAt: now + windowMs,
      };
    }

    const windowExpired = now - existing.windowStart >= existing.windowMs;

    if (windowExpired) {
      return {
        remainingRequests: maxRequests,
        resetAt: now + windowMs,
      };
    }

    return {
      remainingRequests: Math.max(0, maxRequests - existing.count),
      resetAt: existing.windowStart + existing.windowMs,
    };
  },
});
