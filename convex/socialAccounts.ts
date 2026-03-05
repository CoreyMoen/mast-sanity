/**
 * socialAccounts.ts — OAuth and social account management (queries & mutations).
 *
 * Handles connecting/disconnecting social media accounts and
 * storing OAuth tokens. Token refresh actions live in socialAccountActions.ts.
 *
 * Token refresh flow:
 *   1. A cron job (every 6 hours) queries for tokens expiring within 24 hours
 *   2. For each expiring token, it calls refreshTokenForAccount
 *   3. refreshTokenForAccount decrypts the refresh token, calls the platform API,
 *      encrypts the new tokens, and stores them via updateTokens
 *   4. Before publishing, the publishing flow also checks token validity
 *      and triggers a refresh if the token is expired or about to expire
 */

import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { enforceAccountLimit } from "./featureGates";

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List all connected social accounts for the authenticated user.
 */
export const list = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const accounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .collect();

    return accounts.map(({ accessToken, refreshToken, ...safe }: any) => safe);
  },
});

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Save a newly connected social account after OAuth flow.
 */
export const connect = mutation({
  args: {
    platform: v.union(
      v.literal("instagram"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("linkedin"),
    ),
    platformAccountId: v.string(),
    accountName: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    // Check if this platform account is already connected
    const existing = await ctx.db
      .query("socialAccounts")
      .withIndex("by_platform_platformAccountId", (q: any) =>
        q.eq("platform", args.platform).eq("platformAccountId", args.platformAccountId),
      )
      .unique();

    if (existing) {
      // Update tokens for existing account
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        profileImageUrl: args.profileImageUrl,
        isActive: true,
      });
      return existing._id;
    }

    // Enforce subscription tier account limit for new connections
    await enforceAccountLimit(ctx.db, user._id, user.subscriptionTier);

    return await ctx.db.insert("socialAccounts", {
      userId: user._id,
      platform: args.platform,
      platformAccountId: args.platformAccountId,
      accountName: args.accountName,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
      profileImageUrl: args.profileImageUrl,
      isActive: true,
      connectedAt: Date.now(),
    });
  },
});

/**
 * Disconnect (deactivate) a social account.
 */
export const disconnect = mutation({
  args: { accountId: v.id("socialAccounts") },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });
    const user = await ctx.db.query("users").withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject)).unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    const account = await ctx.db.get(args.accountId);
    if (!account) throw new ConvexError({ code: "NOT_FOUND", message: "Account not found" });
    if (account.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your account" });

    await ctx.db.patch(args.accountId, { isActive: false });
  },
});

// ─── Internal Queries ────────────────────────────────────────────────────────

/**
 * Fetch a single social account record for the token refresh flow.
 * Returns the full document including encrypted tokens.
 */
export const getAccountForRefresh = internalQuery({
  args: { accountId: v.id("socialAccounts") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.get(args.accountId);
  },
});

/**
 * Find all active social accounts whose tokens expire before the given threshold.
 * Used by the cron job to proactively refresh tokens.
 *
 * Returns accounts that:
 *   - Are active (isActive === true)
 *   - Have a tokenExpiresAt set (some platforms issue non-expiring tokens)
 *   - Have tokenExpiresAt <= expiryThreshold
 */
export const getExpiringTokenAccounts = internalQuery({
  args: { expiryThreshold: v.number() },
  handler: async (ctx: any, args: any) => {
    // Use the composite index to efficiently find active accounts with
    // token expiry dates up to the threshold.
    const accounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_isActive_tokenExpiresAt", (q: any) =>
        q.eq("isActive", true).lte("tokenExpiresAt", args.expiryThreshold),
      )
      .collect();

    return accounts;
  },
});

// ─── Internal Mutations ──────────────────────────────────────────────────────

/**
 * Internal mutation to update OAuth tokens after a refresh.
 */
export const updateTokens = internalMutation({
  args: {
    accountId: v.id("socialAccounts"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.patch(args.accountId, {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
    });
  },
});
