/**
 * analytics.ts — Analytics queries and mutations.
 *
 * Provides aggregated views for the dashboard, post insights,
 * account insights, and internal helpers for storing analytics data.
 *
 * Actions that call external platform APIs live in analyticsActions.ts
 * (which uses "use node" for Node.js runtime).
 */

import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";
import {
  aggregatePostMetrics,
  calculateEngagementRate,
  calculateGrowthRate,
} from "../lib/analytics/aggregation";
import { resolveUser } from "./lib/auth";

// ─── Analytics lookback days per subscription tier ────────────────────────

const ANALYTICS_LOOKBACK_DAYS: Record<string, number> = {
  free: 7,
  pro: 90,
  business: 365,
};

// ─── Queries: Read analytics data ─────────────────────────────────────────

/**
 * Returns analytics data for a specific post, aggregated across platforms.
 */
export const getPostInsights = query({
  args: { postId: v.id("posts") },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) return null;
    if (post.authorId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your post" });

    const allAnalytics = await ctx.db
      .query("postAnalytics")
      .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
      .collect();

    if (allAnalytics.length === 0) {
      return {
        platforms: [],
        aggregated: {
          impressions: 0,
          reach: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          clicks: 0,
          totalEngagements: 0,
          engagementRate: 0,
          platformCount: 0,
        },
      };
    }

    const latestByPlatform = new Map<string, Doc<"postAnalytics">>();
    for (const record of allAnalytics) {
      const existing = latestByPlatform.get(record.platform);
      if (!existing || record.fetchedAt > existing.fetchedAt) {
        latestByPlatform.set(record.platform, record);
      }
    }

    const platforms = Array.from(latestByPlatform.values());

    const platformMetrics = platforms.map((p: any) => ({
      impressions: p.impressions,
      reach: p.reach,
      likes: p.likes,
      comments: p.comments,
      shares: p.shares,
      saves: p.saves,
      clicks: p.clicks,
    }));

    const aggregated = aggregatePostMetrics(platformMetrics);

    return {
      platforms,
      aggregated,
    };
  },
});

/**
 * Returns time-series analytics for a social account.
 */
export const getAccountInsights = query({
  args: {
    socialAccountId: v.id("socialAccounts"),
    days: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    // Verify the social account belongs to the current user
    const socialAccount = await ctx.db.get(args.socialAccountId);
    if (!socialAccount || socialAccount.userId !== user._id) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Not your account" });
    }

    const maxDays =
      ANALYTICS_LOOKBACK_DAYS[user.subscriptionTier] ?? 7;
    const requestedDays = args.days ?? maxDays;
    const effectiveDays = Math.min(requestedDays, maxDays);

    const startDate = Date.now() - effectiveDays * 24 * 60 * 60 * 1000;

    const analytics = await ctx.db
      .query("accountAnalytics")
      .withIndex("by_socialAccountId_date", (q: any) =>
        q
          .eq("socialAccountId", args.socialAccountId)
          .gte("date", startDate),
      )
      .collect();

    analytics.sort((a: any, b: any) => a.date - b.date);

    let followerGrowthRate = 0;
    if (analytics.length >= 2) {
      const oldest = analytics[0];
      const newest = analytics[analytics.length - 1];
      followerGrowthRate = calculateGrowthRate(
        newest.followers,
        oldest.followers,
      );
    }

    const latest = analytics.length > 0
      ? analytics[analytics.length - 1]
      : null;

    return {
      timeSeries: analytics,
      summary: {
        currentFollowers: latest?.followers ?? 0,
        currentFollowing: latest?.following ?? 0,
        latestEngagementRate: latest?.engagementRate ?? 0,
        followerGrowthRate,
        dataPointCount: analytics.length,
        periodDays: effectiveDays,
      },
    };
  },
});

/**
 * Returns aggregate dashboard stats for the authenticated user.
 */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_authorId", (q: any) => q.eq("authorId", user._id))
      .collect();

    const publishedPosts = posts.filter((p: any) => p.status === "published");
    const scheduledPosts = posts.filter((p: any) => p.status === "scheduled");
    const draftPosts = posts.filter((p: any) => p.status === "draft");

    let totalImpressions = 0;
    let totalReach = 0;
    let totalEngagements = 0;

    const postEngagementMap: Array<{
      postId: Id<"posts">;
      content: string;
      publishedAt: number | undefined;
      impressions: number;
      engagement: number;
      engagementRate: number;
    }> = [];

    for (const post of publishedPosts) {
      const analytics = await ctx.db
        .query("postAnalytics")
        .withIndex("by_postId", (q: any) => q.eq("postId", post._id))
        .collect();

      if (analytics.length === 0) continue;

      const latestByPlatform = new Map<string, Doc<"postAnalytics">>();
      for (const record of analytics) {
        const existing = latestByPlatform.get(record.platform);
        if (!existing || record.fetchedAt > existing.fetchedAt) {
          latestByPlatform.set(record.platform, record);
        }
      }

      let postImpressions = 0;
      let postEngagement = 0;

      for (const record of latestByPlatform.values()) {
        postImpressions += record.impressions;
        totalReach += record.reach;

        const eng =
          record.likes +
          record.comments +
          record.shares +
          record.saves +
          record.clicks;
        postEngagement += eng;
      }

      totalImpressions += postImpressions;
      totalEngagements += postEngagement;

      postEngagementMap.push({
        postId: post._id,
        content: post.content.substring(0, 140),
        publishedAt: post.publishedAt,
        impressions: postImpressions,
        engagement: postEngagement,
        engagementRate: calculateEngagementRate(postImpressions, postEngagement),
      });
    }

    const topPosts = postEngagementMap
      .sort((a: any, b: any) => b.engagement - a.engagement)
      .slice(0, 5);

    const overallEngagementRate = calculateEngagementRate(
      totalImpressions,
      totalEngagements,
    );

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

    let currentPeriodImpressions = 0;
    let currentPeriodEngagements = 0;
    let previousPeriodImpressions = 0;
    let previousPeriodEngagements = 0;

    for (const post of publishedPosts) {
      const analytics = await ctx.db
        .query("postAnalytics")
        .withIndex("by_postId", (q: any) => q.eq("postId", post._id))
        .collect();

      for (const record of analytics) {
        const eng =
          record.likes +
          record.comments +
          record.shares +
          record.saves +
          record.clicks;

        if (record.fetchedAt >= sevenDaysAgo) {
          currentPeriodImpressions += record.impressions;
          currentPeriodEngagements += eng;
        } else if (
          record.fetchedAt >= fourteenDaysAgo &&
          record.fetchedAt < sevenDaysAgo
        ) {
          previousPeriodImpressions += record.impressions;
          previousPeriodEngagements += eng;
        }
      }
    }

    const currentEngagementRate = calculateEngagementRate(
      currentPeriodImpressions,
      currentPeriodEngagements,
    );
    const previousEngagementRate = calculateEngagementRate(
      previousPeriodImpressions,
      previousPeriodEngagements,
    );
    const engagementRateTrend = calculateGrowthRate(
      currentEngagementRate,
      previousEngagementRate,
    );

    const socialAccounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .collect();

    const activeAccounts = socialAccounts.filter((a: any) => a.isActive);

    let totalFollowers = 0;
    for (const account of activeAccounts) {
      const latestSnapshot = await ctx.db
        .query("accountAnalytics")
        .withIndex("by_socialAccountId_date", (q: any) =>
          q.eq("socialAccountId", account._id),
        )
        .order("desc")
        .first();

      if (latestSnapshot) {
        totalFollowers += latestSnapshot.followers;
      }
    }

    return {
      totalPosts: posts.length,
      publishedCount: publishedPosts.length,
      scheduledCount: scheduledPosts.length,
      draftCount: draftPosts.length,
      totalImpressions,
      totalReach,
      totalEngagements,
      totalFollowers,
      overallEngagementRate,
      engagementRateTrend,
      topPosts,
    };
  },
});

/**
 * Returns the top N posts by total engagement within a given time window.
 */
export const getTopPosts = query({
  args: {
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const maxResults = args.limit ?? 10;
    const startDate = args.startDate ?? 0;
    const endDate = args.endDate ?? Date.now();

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_authorId", (q: any) => q.eq("authorId", user._id))
      .collect();

    const publishedPosts = posts.filter(
      (p: any) =>
        p.status === "published" &&
        p.publishedAt !== undefined &&
        p.publishedAt >= startDate &&
        p.publishedAt <= endDate,
    );

    const postRankings: Array<{
      postId: Id<"posts">;
      content: string;
      platforms: string[];
      publishedAt: number | undefined;
      impressions: number;
      reach: number;
      likes: number;
      comments: number;
      shares: number;
      saves: number;
      clicks: number;
      totalEngagements: number;
      engagementRate: number;
    }> = [];

    for (const post of publishedPosts) {
      const analytics = await ctx.db
        .query("postAnalytics")
        .withIndex("by_postId", (q: any) => q.eq("postId", post._id))
        .collect();

      if (analytics.length === 0) continue;

      const latestByPlatform = new Map<string, Doc<"postAnalytics">>();
      for (const record of analytics) {
        const existing = latestByPlatform.get(record.platform);
        if (!existing || record.fetchedAt > existing.fetchedAt) {
          latestByPlatform.set(record.platform, record);
        }
      }

      const metrics = Array.from(latestByPlatform.values());
      const agg = aggregatePostMetrics(
        metrics.map((m) => ({
          impressions: m.impressions,
          reach: m.reach,
          likes: m.likes,
          comments: m.comments,
          shares: m.shares,
          saves: m.saves,
          clicks: m.clicks,
        })),
      );

      postRankings.push({
        postId: post._id,
        content: post.content.substring(0, 280),
        platforms: post.platforms,
        publishedAt: post.publishedAt,
        impressions: agg.impressions,
        reach: agg.reach,
        likes: agg.likes,
        comments: agg.comments,
        shares: agg.shares,
        saves: agg.saves,
        clicks: agg.clicks,
        totalEngagements: agg.totalEngagements,
        engagementRate: agg.engagementRate,
      });
    }

    postRankings.sort((a: any, b: any) => b.totalEngagements - a.totalEngagements);

    return postRankings.slice(0, maxResults);
  },
});

/**
 * Returns engagement time-series data grouped by day.
 */
export const getEngagementTimeSeries = query({
  args: {
    days: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const maxDays = ANALYTICS_LOOKBACK_DAYS[user.subscriptionTier] ?? 7;
    const effectiveDays = Math.min(args.days, maxDays);

    const startTimestamp = Date.now() - effectiveDays * 24 * 60 * 60 * 1000;

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_authorId", (q: any) => q.eq("authorId", user._id))
      .collect();

    const publishedPostIds = new Set(
      posts.filter((p: any) => p.status === "published").map((p: any) => p._id),
    );

    const allAnalytics = await ctx.db
      .query("postAnalytics")
      .withIndex("by_periodStart", (q: any) => q.gte("periodStart", startTimestamp))
      .collect();

    const userAnalytics = allAnalytics.filter((a: any) =>
      publishedPostIds.has(a.postId),
    );

    const dayMap = new Map<
      string,
      { impressions: number; reach: number; engagement: number }
    >();

    for (let i = effectiveDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      dayMap.set(key, { impressions: 0, reach: 0, engagement: 0 });
    }

    for (const record of userAnalytics) {
      const d = new Date(record.periodStart);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

      const existing = dayMap.get(key);
      if (existing) {
        existing.impressions += record.impressions;
        existing.reach += record.reach;
        existing.engagement +=
          record.likes + record.comments + record.shares;
      }
    }

    const entries = Array.from(dayMap.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    return entries.map(([dateKey, metrics]) => {
      const d = new Date(dateKey + "T00:00:00Z");
      const label =
        effectiveDays <= 7
          ? d.toLocaleDateString("en-US", {
              weekday: "short",
              timeZone: "UTC",
            })
          : d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            });

      return {
        date: label,
        impressions: metrics.impressions,
        reach: metrics.reach,
        engagement: metrics.engagement,
      };
    });
  },
});

/**
 * Returns per-platform engagement metrics.
 */
export const getPlatformBreakdown = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_authorId", (q: any) => q.eq("authorId", user._id))
      .collect();

    const publishedPosts = posts.filter((p: any) => p.status === "published");

    const platformTotals = new Map<
      string,
      { impressions: number; likes: number; comments: number; shares: number }
    >();

    for (const post of publishedPosts) {
      const analytics = await ctx.db
        .query("postAnalytics")
        .withIndex("by_postId", (q: any) => q.eq("postId", post._id))
        .collect();

      const latestByPlatform = new Map<string, Doc<"postAnalytics">>();
      for (const record of analytics) {
        const existing = latestByPlatform.get(record.platform);
        if (!existing || record.fetchedAt > existing.fetchedAt) {
          latestByPlatform.set(record.platform, record);
        }
      }

      for (const [platform, record] of latestByPlatform.entries()) {
        const existing = platformTotals.get(platform) ?? {
          impressions: 0,
          likes: 0,
          comments: 0,
          shares: 0,
        };
        existing.impressions += record.impressions;
        existing.likes += record.likes;
        existing.comments += record.comments;
        existing.shares += record.shares;
        platformTotals.set(platform, existing);
      }
    }

    return Array.from(platformTotals.entries()).map(
      ([platform, metrics]) => ({
        platform,
        impressions: metrics.impressions,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
      }),
    );
  },
});

/**
 * Get raw analytics for a specific post across all platforms.
 */
export const getPostAnalytics = query({
  args: { postId: v.id("posts") },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) return [];
    if (post.authorId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your post" });

    return await ctx.db
      .query("postAnalytics")
      .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
      .collect();
  },
});

/**
 * Get account-level analytics for a social account within a date range.
 */
export const getAccountAnalytics = query({
  args: {
    socialAccountId: v.id("socialAccounts"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);
    const account = await ctx.db.get(args.socialAccountId);
    if (!account) return [];
    if (account.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your account" });

    return await ctx.db
      .query("accountAnalytics")
      .withIndex("by_socialAccountId_date", (q: any) =>
        q
          .eq("socialAccountId", args.socialAccountId)
          .gte("date", args.startDate)
          .lte("date", args.endDate),
      )
      .collect();
  },
});

// ─── Internal Queries ─────────────────────────────────────────────────────

/**
 * Fetch all platformPost records for a given post.
 */
export const getPlatformPostsForPost = internalQuery({
  args: { postId: v.id("posts") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("platformPosts")
      .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
      .collect();
  },
});

/**
 * Fetch a social account by its ID.
 */
export const getSocialAccount = internalQuery({
  args: { socialAccountId: v.id("socialAccounts") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.get(args.socialAccountId);
  },
});

/**
 * Fetch all active social accounts across all users.
 */
export const getAllActiveSocialAccounts = internalQuery({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.db
      .query("socialAccounts")
      .withIndex("by_isActive_tokenExpiresAt", (q: any) => q.eq("isActive", true))
      .collect();
  },
});

/**
 * Fetch posts published since the given timestamp.
 */
export const getRecentlyPublishedPosts = internalQuery({
  args: { since: v.number() },
  handler: async (ctx: any, args: any) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .collect();

    return posts.filter(
      (p: any) => p.publishedAt !== undefined && p.publishedAt >= args.since,
    );
  },
});

// ─── Internal Mutations ───────────────────────────────────────────────────

/**
 * Internal mutation to upsert post analytics data.
 */
export const storePostAnalytics = internalMutation({
  args: {
    postId: v.id("posts"),
    platformPostId: v.string(),
    platform: v.union(
      v.literal("instagram"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("linkedin"),
    ),
    impressions: v.number(),
    reach: v.number(),
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    saves: v.number(),
    clicks: v.number(),
    periodStart: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.insert("postAnalytics", {
      ...args,
      fetchedAt: Date.now(),
    });
  },
});

/**
 * Internal mutation to store daily account analytics snapshot.
 */
export const storeAccountAnalytics = internalMutation({
  args: {
    socialAccountId: v.id("socialAccounts"),
    date: v.number(),
    followers: v.number(),
    following: v.number(),
    engagementRate: v.number(),
    postsCount: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.insert("accountAnalytics", {
      ...args,
      fetchedAt: Date.now(),
    });
  },
});

// ─── Engagement Heatmap ───────────────────────────────────────────────────

/**
 * Returns engagement data grouped by day-of-week and hour.
 */
export const getEngagementHeatmap = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_authorId", (q: any) => q.eq("authorId", user._id))
      .collect();

    const publishedPosts = posts.filter(
      (p: any) => p.status === "published" && p.publishedAt !== undefined,
    );

    const heatmap = new Map<string, number>();

    for (const post of publishedPosts) {
      const analytics = await ctx.db
        .query("postAnalytics")
        .withIndex("by_postId", (q: any) => q.eq("postId", post._id))
        .collect();

      if (analytics.length === 0) continue;

      const latestByPlatform = new Map<string, Doc<"postAnalytics">>();
      for (const record of analytics) {
        const existing = latestByPlatform.get(record.platform);
        if (!existing || record.fetchedAt > existing.fetchedAt) {
          latestByPlatform.set(record.platform, record);
        }
      }

      let postEngagement = 0;
      for (const record of latestByPlatform.values()) {
        postEngagement += record.likes + record.comments + record.shares;
      }

      if (postEngagement === 0) continue;

      const publishedDate = new Date(post.publishedAt);
      const dayOfWeek = publishedDate.getUTCDay();
      const hour = publishedDate.getUTCHours();

      const key = `${dayOfWeek}-${hour}`;
      heatmap.set(key, (heatmap.get(key) ?? 0) + postEngagement);
    }

    const result: Array<{ day: number; hour: number; engagement: number }> = [];
    for (const [key, engagement] of heatmap.entries()) {
      const [dayStr, hourStr] = key.split("-");
      result.push({
        day: parseInt(dayStr, 10),
        hour: parseInt(hourStr, 10),
        engagement,
      });
    }

    return result;
  },
});
