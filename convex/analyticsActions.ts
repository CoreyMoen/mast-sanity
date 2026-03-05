"use node";

/**
 * analyticsActions.ts — Analytics fetching actions that call external platform APIs.
 *
 * These must run in Node.js because they use platform API clients and decryption.
 * Queries and mutations remain in analytics.ts (Convex runtime).
 */

import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { instagramClient } from "../lib/platforms/instagram";
import { facebookClient } from "../lib/platforms/facebook";
import { twitterClient } from "../lib/platforms/twitter";
import { linkedinClient } from "../lib/platforms/linkedin";
import type { SocialPlatformClient } from "../lib/platforms/types";
import { decrypt } from "../lib/utils/encryption";

// ─── Platform client registry ─────────────────────────────────────────────

const platformClients: Record<string, SocialPlatformClient> = {
  instagram: instagramClient,
  facebook: facebookClient,
  twitter: twitterClient,
  linkedin: linkedinClient,
};

// ─── Helper: Decrypt an access token safely ──────────────────────────────

function decryptToken(encryptedToken: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) return encryptedToken;

  try {
    return decrypt(encryptedToken, encryptionKey);
  } catch {
    return encryptedToken;
  }
}

// ─── Actions: Fetch analytics from platform APIs ─────────────────────────

/**
 * Fetch post-level analytics for a given post across all platforms.
 */
export const fetchPostAnalytics = action({
  args: { postId: v.id("posts") },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    // Verify post ownership
    const user = await ctx.runQuery(internal.ai.getUserForAi, { clerkId: identity.subject });
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
    const post = await ctx.runQuery(internal.publishing.getPostForPublishing, { postId: args.postId });
    if (!post) throw new ConvexError({ code: "NOT_FOUND", message: "Post not found" });
    if (post.authorId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your post" });

    const platformPosts = await ctx.runQuery(
      internal.analytics.getPlatformPostsForPost,
      { postId: args.postId },
    );

    if (platformPosts.length === 0) {
      return { success: true, results: [], message: "No platform posts found" };
    }

    const results: Array<{
      platform: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const pp of platformPosts) {
      if (pp.status !== "published" || !pp.platformPostId) {
        continue;
      }

      const client = platformClients[pp.platform];
      if (!client) {
        results.push({
          platform: pp.platform,
          success: false,
          error: `Unknown platform: ${pp.platform}`,
        });
        continue;
      }

      try {
        const socialAccount = await ctx.runQuery(
          internal.analytics.getSocialAccount,
          { socialAccountId: pp.socialAccountId },
        );

        if (!socialAccount || !socialAccount.isActive) {
          results.push({
            platform: pp.platform,
            success: false,
            error: "Social account not found or inactive",
          });
          continue;
        }

        const accessToken = decryptToken(socialAccount.accessToken);
        const metrics = await client.getPostAnalytics(
          accessToken,
          pp.platformPostId,
        );

        await ctx.runMutation(internal.analytics.storePostAnalytics, {
          postId: args.postId,
          platformPostId: pp.platformPostId,
          platform: pp.platform as
            | "instagram"
            | "facebook"
            | "twitter"
            | "linkedin",
          impressions: metrics.impressions,
          reach: metrics.reach,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          saves: metrics.saves,
          clicks: metrics.clicks,
          periodStart: Date.now(),
        });

        results.push({ platform: pp.platform, success: true });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown analytics error";
        console.error(
          `Failed to fetch analytics for post ${args.postId} on ${pp.platform}: ${errorMessage}`,
        );
        results.push({
          platform: pp.platform,
          success: false,
          error: errorMessage,
        });
      }
    }

    return { success: true, results };
  },
});

/**
 * Fetch account-level metrics for a given social account.
 */
export const fetchAccountAnalytics = action({
  args: { socialAccountId: v.id("socialAccounts") },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    // Verify account ownership
    const user = await ctx.runQuery(internal.ai.getUserForAi, { clerkId: identity.subject });
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    const account = await ctx.runQuery(internal.analytics.getSocialAccount, {
      socialAccountId: args.socialAccountId,
    });

    if (!account) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Social account not found" });
    }
    if (account.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your account" });

    if (!account.isActive) {
      return { success: false, error: "Social account is inactive" };
    }

    const client = platformClients[account.platform];
    if (!client) {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: `Unknown platform: ${account.platform}` });
    }

    try {
      const accessToken = decryptToken(account.accessToken);

      const metrics = await client.getAccountMetrics(
        accessToken,
        account.platformAccountId,
      );

      const now = new Date();
      const dateTimestamp = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).getTime();

      await ctx.runMutation(internal.analytics.storeAccountAnalytics, {
        socialAccountId: args.socialAccountId,
        date: dateTimestamp,
        followers: metrics.followers,
        following: metrics.following,
        engagementRate: metrics.engagementRate,
        postsCount: metrics.postsCount,
      });

      return { success: true, metrics };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Failed to fetch account analytics for ${args.socialAccountId}: ${errorMessage}`,
      );
      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Fetch analytics for all active social accounts and recently published posts.
 * Called by the cron job every 6 hours.
 */
export const fetchAllAnalytics = internalAction({
  args: {},
  handler: async (ctx: any) => {
    const activeAccounts = await ctx.runQuery(
      internal.analytics.getAllActiveSocialAccounts,
    );

    const accountResults: Array<{
      accountId: string;
      platform: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const account of activeAccounts) {
      try {
        const result = await ctx.runAction(
          internal.analyticsActions.fetchAccountAnalyticsInternal,
          { socialAccountId: account._id },
        );
        accountResults.push({
          accountId: account._id,
          platform: account.platform,
          success: result.success,
          error: result.error,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `Failed to fetch account analytics for ${account._id} (${account.platform}): ${errorMessage}`,
        );
        accountResults.push({
          accountId: account._id,
          platform: account.platform,
          success: false,
          error: errorMessage,
        });
      }
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentPosts = await ctx.runQuery(
      internal.analytics.getRecentlyPublishedPosts,
      { since: sevenDaysAgo },
    );

    const postResults: Array<{
      postId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const post of recentPosts) {
      try {
        const result = await ctx.runAction(
          internal.analyticsActions.fetchPostAnalyticsInternal,
          { postId: post._id },
        );
        postResults.push({
          postId: post._id,
          success: result.success,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `Failed to fetch post analytics for ${post._id}: ${errorMessage}`,
        );
        postResults.push({
          postId: post._id,
          success: false,
          error: errorMessage,
        });
      }
    }

    const totalAccounts = accountResults.length;
    const successAccounts = accountResults.filter((r) => r.success).length;
    const totalPosts = postResults.length;
    const successPosts = postResults.filter((r) => r.success).length;

    console.log(
      `Analytics fetch complete: accounts ${successAccounts}/${totalAccounts}, posts ${successPosts}/${totalPosts}`,
    );

    return { accountResults, postResults };
  },
});

/**
 * Internal version of fetchPostAnalytics callable from other actions.
 */
export const fetchPostAnalyticsInternal = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx: any, args: any) => {
    const platformPosts = await ctx.runQuery(
      internal.analytics.getPlatformPostsForPost,
      { postId: args.postId },
    );

    if (platformPosts.length === 0) {
      return { success: true, results: [], message: "No platform posts found" };
    }

    const results: Array<{
      platform: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const pp of platformPosts) {
      if (pp.status !== "published" || !pp.platformPostId) {
        continue;
      }

      const client = platformClients[pp.platform];
      if (!client) {
        results.push({
          platform: pp.platform,
          success: false,
          error: `Unknown platform: ${pp.platform}`,
        });
        continue;
      }

      try {
        const socialAccount = await ctx.runQuery(
          internal.analytics.getSocialAccount,
          { socialAccountId: pp.socialAccountId },
        );

        if (!socialAccount || !socialAccount.isActive) {
          results.push({
            platform: pp.platform,
            success: false,
            error: "Social account not found or inactive",
          });
          continue;
        }

        const accessToken = decryptToken(socialAccount.accessToken);
        const metrics = await client.getPostAnalytics(
          accessToken,
          pp.platformPostId,
        );

        await ctx.runMutation(internal.analytics.storePostAnalytics, {
          postId: args.postId,
          platformPostId: pp.platformPostId,
          platform: pp.platform as
            | "instagram"
            | "facebook"
            | "twitter"
            | "linkedin",
          impressions: metrics.impressions,
          reach: metrics.reach,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          saves: metrics.saves,
          clicks: metrics.clicks,
          periodStart: Date.now(),
        });

        results.push({ platform: pp.platform, success: true });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown analytics error";
        console.error(
          `Failed to fetch analytics for post ${args.postId} on ${pp.platform}: ${errorMessage}`,
        );
        results.push({
          platform: pp.platform,
          success: false,
          error: errorMessage,
        });
      }
    }

    return { success: true, results };
  },
});

/**
 * Internal version of fetchAccountAnalytics callable from other actions.
 */
export const fetchAccountAnalyticsInternal = internalAction({
  args: { socialAccountId: v.id("socialAccounts") },
  handler: async (ctx: any, args: any) => {
    const account = await ctx.runQuery(internal.analytics.getSocialAccount, {
      socialAccountId: args.socialAccountId,
    });

    if (!account) {
      return { success: false, error: "Social account not found" };
    }

    if (!account.isActive) {
      return { success: false, error: "Social account is inactive" };
    }

    const client = platformClients[account.platform];
    if (!client) {
      return { success: false, error: `Unknown platform: ${account.platform}` };
    }

    try {
      const accessToken = decryptToken(account.accessToken);

      const metrics = await client.getAccountMetrics(
        accessToken,
        account.platformAccountId,
      );

      const now = new Date();
      const dateTimestamp = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).getTime();

      await ctx.runMutation(internal.analytics.storeAccountAnalytics, {
        socialAccountId: args.socialAccountId,
        date: dateTimestamp,
        followers: metrics.followers,
        following: metrics.following,
        engagementRate: metrics.engagementRate,
        postsCount: metrics.postsCount,
      });

      return { success: true, metrics };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Failed to fetch account analytics for ${args.socialAccountId}: ${errorMessage}`,
      );
      return { success: false, error: errorMessage };
    }
  },
});
