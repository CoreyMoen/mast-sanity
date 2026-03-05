/**
 * dataRetention.ts — Data retention enforcement per subscription tier.
 *
 * Enforces analytics and AI usage log retention policies based on
 * each user's subscription tier (free: 7 days, pro: 90 days, business: 365 days).
 * The cron job calls enforceRetention daily, which iterates over all users,
 * calculates their retention cutoff, and deletes expired records in batches.
 */

import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ─── Retention days per tier (server-side source of truth) ──────────────────

const RETENTION_DAYS: Record<string, number> = {
  free: 7,
  pro: 90,
  business: 365,
};

/** Maximum records to delete in a single mutation to avoid timeouts. */
const DELETE_BATCH_SIZE = 100;

// ─── Public queries ─────────────────────────────────────────────────────────

/**
 * Returns the retention policy for the authenticated user.
 * Includes retention days, next cleanup time, and estimated data counts.
 */
export const getRetentionPolicy = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const tier = user.subscriptionTier;
    const retentionDays = RETENTION_DAYS[tier] ?? RETENTION_DAYS.free;
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    // Count total analytics records for this user
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_authorId", (q: any) => q.eq("authorId", user._id))
      .collect();
    const postIds = new Set(posts.map((p: any) => p._id));

    const allPostAnalytics = await ctx.db
      .query("postAnalytics")
      .withIndex("by_periodStart")
      .collect();
    const userPostAnalytics = allPostAnalytics.filter((pa: any) =>
      postIds.has(pa.postId),
    );

    // Count account analytics via user's social accounts
    const socialAccounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .collect();
    const socialAccountIds = new Set(socialAccounts.map((sa: any) => sa._id));

    const allAccountAnalytics = await ctx.db
      .query("accountAnalytics")
      .withIndex("by_date")
      .collect();
    const userAccountAnalytics = allAccountAnalytics.filter((aa: any) =>
      socialAccountIds.has(aa.socialAccountId),
    );

    const aiLogs = await ctx.db
      .query("aiUsageLog")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .collect();

    // Count expired records
    const expiredPostAnalytics = userPostAnalytics.filter(
      (pa: any) => pa.periodStart < cutoff,
    ).length;
    const expiredAccountAnalytics = userAccountAnalytics.filter(
      (aa: any) => aa.date < cutoff,
    ).length;
    const expiredAiLogs = aiLogs.filter(
      (log: any) => log.createdAt < cutoff,
    ).length;

    return {
      tier,
      retentionDays,
      totalPostAnalytics: userPostAnalytics.length,
      totalAccountAnalytics: userAccountAnalytics.length,
      totalAiLogs: aiLogs.length,
      expiredPostAnalytics,
      expiredAccountAnalytics,
      expiredAiLogs,
    };
  },
});

/**
 * Preview what data would be deleted if cleanup ran now.
 * Returns counts by table for the authenticated user.
 */
export const previewCleanup = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const tier = user.subscriptionTier;
    const retentionDays = RETENTION_DAYS[tier] ?? RETENTION_DAYS.free;
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    // Post analytics — find posts owned by this user
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_authorId", (q: any) => q.eq("authorId", user._id))
      .collect();
    const postIds = new Set(posts.map((p: any) => p._id));

    const allPostAnalytics = await ctx.db
      .query("postAnalytics")
      .withIndex("by_periodStart")
      .collect();
    const expiredPostAnalytics = allPostAnalytics.filter(
      (pa: any) => postIds.has(pa.postId) && pa.periodStart < cutoff,
    );

    // Account analytics — via user's social accounts
    const socialAccounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .collect();
    const socialAccountIds = new Set(socialAccounts.map((sa: any) => sa._id));

    const allAccountAnalytics = await ctx.db
      .query("accountAnalytics")
      .withIndex("by_date")
      .collect();
    const expiredAccountAnalytics = allAccountAnalytics.filter(
      (aa: any) => socialAccountIds.has(aa.socialAccountId) && aa.date < cutoff,
    );

    // AI usage logs
    const expiredAiLogs = await ctx.db
      .query("aiUsageLog")
      .withIndex("by_userId_createdAt", (q: any) =>
        q.eq("userId", user._id).lt("createdAt", cutoff),
      )
      .collect();

    return {
      retentionDays,
      cutoffDate: cutoff,
      postAnalyticsCount: expiredPostAnalytics.length,
      accountAnalyticsCount: expiredAccountAnalytics.length,
      aiUsageLogCount: expiredAiLogs.length,
      totalCount:
        expiredPostAnalytics.length +
        expiredAccountAnalytics.length +
        expiredAiLogs.length,
    };
  },
});

// ─── Internal queries ───────────────────────────────────────────────────────

/**
 * Fetch all users for the retention cron to iterate over.
 */
export const getAllUsers = internalQuery({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.db.query("users").collect();
  },
});

/**
 * Find expired post analytics IDs for a user, limited to a batch size.
 */
export const getExpiredPostAnalytics = internalQuery({
  args: {
    userId: v.id("users"),
    cutoff: v.number(),
    limit: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    // Get the user's post IDs
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_authorId", (q: any) => q.eq("authorId", args.userId))
      .collect();
    const postIds = new Set(posts.map((p: any) => p._id));

    // Find expired post analytics belonging to this user's posts
    const expired = await ctx.db
      .query("postAnalytics")
      .withIndex("by_periodStart", (q: any) => q.lt("periodStart", args.cutoff))
      .collect();

    return expired
      .filter((pa: any) => postIds.has(pa.postId))
      .slice(0, args.limit)
      .map((pa: any) => pa._id);
  },
});

/**
 * Find expired account analytics IDs for a user, limited to a batch size.
 */
export const getExpiredAccountAnalytics = internalQuery({
  args: {
    userId: v.id("users"),
    cutoff: v.number(),
    limit: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    // Get the user's social account IDs
    const socialAccounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .collect();
    const socialAccountIds = new Set(socialAccounts.map((sa: any) => sa._id));

    // Find expired account analytics for these social accounts
    const expired = await ctx.db
      .query("accountAnalytics")
      .withIndex("by_date", (q: any) => q.lt("date", args.cutoff))
      .collect();

    return expired
      .filter((aa: any) => socialAccountIds.has(aa.socialAccountId))
      .slice(0, args.limit)
      .map((aa: any) => aa._id);
  },
});

/**
 * Find expired AI usage log IDs for a user, limited to a batch size.
 */
export const getExpiredAiUsageLogs = internalQuery({
  args: {
    userId: v.id("users"),
    cutoff: v.number(),
    limit: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const expired = await ctx.db
      .query("aiUsageLog")
      .withIndex("by_userId_createdAt", (q: any) =>
        q.eq("userId", args.userId).lt("createdAt", args.cutoff),
      )
      .collect();

    return expired.slice(0, args.limit).map((log: any) => log._id);
  },
});

// ─── Internal mutations ─────────────────────────────────────────────────────

/**
 * Delete a batch of expired records for a single user.
 * Accepts arrays of document IDs to delete from each table.
 * Batches deletes to avoid overwhelming the database.
 */
export const cleanupUserData = internalMutation({
  args: {
    postAnalyticsIds: v.array(v.id("postAnalytics")),
    accountAnalyticsIds: v.array(v.id("accountAnalytics")),
    aiUsageLogIds: v.array(v.id("aiUsageLog")),
  },
  handler: async (ctx: any, args: any) => {
    let deleted = 0;

    for (const id of args.postAnalyticsIds) {
      await ctx.db.delete(id);
      deleted++;
    }

    for (const id of args.accountAnalyticsIds) {
      await ctx.db.delete(id);
      deleted++;
    }

    for (const id of args.aiUsageLogIds) {
      await ctx.db.delete(id);
      deleted++;
    }

    return { deleted };
  },
});

// ─── Main enforcement action (called by cron) ──────────────────────────────

/**
 * The main retention enforcement action called daily by the cron scheduler.
 * Iterates over all users, determines their retention cutoff based on tier,
 * and deletes expired analytics and AI usage log records in batches.
 */
export const enforceRetention = internalAction({
  args: {},
  handler: async (ctx: any) => {
    const users = await ctx.runQuery(internal.dataRetention.getAllUsers, {});

    let totalDeleted = 0;
    let usersProcessed = 0;

    for (const user of users) {
      const tier = user.subscriptionTier;
      const retentionDays = RETENTION_DAYS[tier] ?? RETENTION_DAYS.free;
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

      let userDeleted = 0;

      // Delete expired post analytics in batches
      let hasMore = true;
      while (hasMore) {
        const expiredIds = await ctx.runQuery(
          internal.dataRetention.getExpiredPostAnalytics,
          { userId: user._id, cutoff, limit: DELETE_BATCH_SIZE },
        );

        if (expiredIds.length === 0) {
          hasMore = false;
          break;
        }

        const result = await ctx.runMutation(
          internal.dataRetention.cleanupUserData,
          {
            postAnalyticsIds: expiredIds as Id<"postAnalytics">[],
            accountAnalyticsIds: [],
            aiUsageLogIds: [],
          },
        );
        userDeleted += result.deleted;

        if (expiredIds.length < DELETE_BATCH_SIZE) {
          hasMore = false;
        }
      }

      // Delete expired account analytics in batches
      hasMore = true;
      while (hasMore) {
        const expiredIds = await ctx.runQuery(
          internal.dataRetention.getExpiredAccountAnalytics,
          { userId: user._id, cutoff, limit: DELETE_BATCH_SIZE },
        );

        if (expiredIds.length === 0) {
          hasMore = false;
          break;
        }

        const result = await ctx.runMutation(
          internal.dataRetention.cleanupUserData,
          {
            postAnalyticsIds: [],
            accountAnalyticsIds: expiredIds as Id<"accountAnalytics">[],
            aiUsageLogIds: [],
          },
        );
        userDeleted += result.deleted;

        if (expiredIds.length < DELETE_BATCH_SIZE) {
          hasMore = false;
        }
      }

      // Delete expired AI usage logs in batches
      hasMore = true;
      while (hasMore) {
        const expiredIds = await ctx.runQuery(
          internal.dataRetention.getExpiredAiUsageLogs,
          { userId: user._id, cutoff, limit: DELETE_BATCH_SIZE },
        );

        if (expiredIds.length === 0) {
          hasMore = false;
          break;
        }

        const result = await ctx.runMutation(
          internal.dataRetention.cleanupUserData,
          {
            postAnalyticsIds: [],
            accountAnalyticsIds: [],
            aiUsageLogIds: expiredIds as Id<"aiUsageLog">[],
          },
        );
        userDeleted += result.deleted;

        if (expiredIds.length < DELETE_BATCH_SIZE) {
          hasMore = false;
        }
      }

      if (userDeleted > 0) {
        console.log(
          `[dataRetention] Deleted ${userDeleted} expired records for user ${user._id} (${tier} tier, ${retentionDays}-day retention)`,
        );
      }

      totalDeleted += userDeleted;
      usersProcessed++;
    }

    console.log(
      `[dataRetention] Retention enforcement complete: ${totalDeleted} records deleted across ${usersProcessed} users`,
    );

    return { totalDeleted, usersProcessed };
  },
});
