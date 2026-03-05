/**
 * featureGates.ts — Server-side subscription tier enforcement.
 *
 * Provides queries that return current usage vs. limits for the
 * authenticated user, and internal enforcement functions that throw
 * a ConvexError when a tier limit would be exceeded.
 */

import { ConvexError } from "convex/values";
import { query } from "./_generated/server";

// ─── Tier limits (server-side source of truth) ──────────────────────────────

const TIER_LIMITS = {
  free: {
    connectedAccounts: 1,
    scheduledPostsPerMonth: 10,
    teamMembers: 1,
    aiCreditsPerMonth: 10,
  },
  pro: {
    connectedAccounts: 10,
    scheduledPostsPerMonth: Infinity,
    teamMembers: 3,
    aiCreditsPerMonth: 100,
  },
  business: {
    connectedAccounts: 25,
    scheduledPostsPerMonth: Infinity,
    teamMembers: 15,
    aiCreditsPerMonth: Infinity,
  },
} as const;

type Tier = keyof typeof TIER_LIMITS;

// ─── Helper: get start of current month (UTC) ──────────────────────────────

function startOfMonth(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
}

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Check the user's post limit for the current month.
 * Returns { allowed, current, max, tier }.
 */
export const checkPostLimit = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const tier = user.subscriptionTier as Tier;
    const max = TIER_LIMITS[tier].scheduledPostsPerMonth;

    // Count posts created this month
    const monthStart = startOfMonth();
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_authorId", (q: any) => q.eq("authorId", user._id))
      .collect();

    const current = posts.filter((p: any) => p.createdAt >= monthStart).length;

    return {
      allowed: max === Infinity || current < max,
      current,
      max: max === Infinity ? -1 : max,
      tier,
    };
  },
});

/**
 * Check the user's connected account limit.
 * Returns { allowed, current, max, tier }.
 */
export const checkAccountLimit = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const tier = user.subscriptionTier as Tier;
    const max = TIER_LIMITS[tier].connectedAccounts;

    const accounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .collect();

    const current = accounts.filter((a: any) => a.isActive).length;

    return {
      allowed: current < max,
      current,
      max,
      tier,
    };
  },
});

/**
 * Check the user's team member limit.
 * Returns { allowed, current, max, tier }.
 */
export const checkTeamLimit = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const tier = user.subscriptionTier as Tier;
    const max = TIER_LIMITS[tier].teamMembers;

    // For now, team members are tracked via orgMembers.
    // Count members across the user's organizations.
    const memberships = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .collect();

    // Find the org the user owns (admin role) and count its members
    let current = 1; // The user themselves
    for (const membership of memberships) {
      if (membership.role === "admin") {
        const orgMembers = await ctx.db
          .query("orgMembers")
          .withIndex("by_orgId", (q: any) => q.eq("orgId", membership.orgId))
          .collect();
        current = Math.max(current, orgMembers.length);
      }
    }

    return {
      allowed: current < max,
      current,
      max,
      tier,
    };
  },
});

/**
 * Check the user's AI credit usage for the current month.
 * Returns { allowed, current, max, tier }.
 */
export const checkAILimit = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const tier = user.subscriptionTier as Tier;
    const max = TIER_LIMITS[tier].aiCreditsPerMonth;

    return {
      allowed: max === Infinity || user.aiCreditsUsed < max,
      current: user.aiCreditsUsed,
      max: max === Infinity ? -1 : max,
      tier,
    };
  },
});

// ─── Enforcement helpers (called from other mutations) ──────────────────────
// These are exported as regular async functions that accept db + userId
// so they can be called directly from mutation handlers.

/**
 * Enforce post creation limit. Throws ConvexError if limit exceeded.
 * Call this inside a mutation handler before inserting a new post.
 */
export async function enforcePostLimit(
  db: any,
  userId: any,
  tier: Tier,
) {
  const max = TIER_LIMITS[tier].scheduledPostsPerMonth;
  if (max === Infinity) return;

  const monthStart = startOfMonth();
  const posts = await db
    .query("posts")
    .withIndex("by_authorId", (q: any) => q.eq("authorId", userId))
    .collect();

  const current = posts.filter((p: any) => p.createdAt >= monthStart).length;

  if (current >= max) {
    throw new ConvexError({
      code: "LIMIT_EXCEEDED",
      message: `You have reached your monthly post limit (${max} posts). Upgrade your plan to create more posts.`,
      limit: max,
      current,
    });
  }
}

/**
 * Enforce connected account limit. Throws ConvexError if limit exceeded.
 * Call this inside a mutation handler before inserting a new social account.
 */
export async function enforceAccountLimit(
  db: any,
  userId: any,
  tier: Tier,
) {
  const max = TIER_LIMITS[tier].connectedAccounts;

  const accounts = await db
    .query("socialAccounts")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect();

  const current = accounts.filter((a: any) => a.isActive).length;

  if (current >= max) {
    throw new ConvexError({
      code: "LIMIT_EXCEEDED",
      message: `You have reached your connected account limit (${max} accounts). Upgrade your plan to connect more accounts.`,
      limit: max,
      current,
    });
  }
}

/**
 * Enforce team member limit. Throws ConvexError if limit exceeded.
 * Call this inside a mutation handler before adding a team member.
 */
export async function enforceTeamLimit(
  db: any,
  orgId: any,
  tier: Tier,
) {
  const max = TIER_LIMITS[tier].teamMembers;

  const members = await db
    .query("orgMembers")
    .withIndex("by_orgId", (q: any) => q.eq("orgId", orgId))
    .collect();

  if (members.length >= max) {
    throw new ConvexError({
      code: "LIMIT_EXCEEDED",
      message: `You have reached your team member limit (${max} members). Upgrade your plan to invite more team members.`,
      limit: max,
      current: members.length,
    });
  }
}
