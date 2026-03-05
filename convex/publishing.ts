/**
 * publishing.ts — Internal queries and mutations for the publishing pipeline.
 *
 * Contains all data-access functions (queries and mutations) used by the
 * publishing actions in publishingActions.ts. These functions run in the
 * default Convex runtime (no Node.js required).
 */

import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ─── Internal queries ────────────────────────────────────────────────────────

/**
 * Internal query to fetch a post for publishing.
 */
export const getPostForPublishing = internalQuery({
  args: { postId: v.id("posts") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.get(args.postId);
  },
});

/**
 * Internal query to fetch social accounts matching the post's target platforms.
 */
export const getSocialAccountsForPost = internalQuery({
  args: {
    authorId: v.id("users"),
    platforms: v.array(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const allAccounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.authorId))
      .collect();

    // Filter to only active accounts on the selected platforms
    return allAccounts.filter(
      (account: any) =>
        account.isActive && args.platforms.includes(account.platform),
    );
  },
});

/**
 * Internal query to find posts that are scheduled and due for publishing.
 */
export const getDueScheduledPosts = internalQuery({
  args: { now: v.number() },
  handler: async (ctx: any, args: any) => {
    const duePosts = await ctx.db
      .query("posts")
      .withIndex("by_status_scheduledAt", (q: any) =>
        q.eq("status", "scheduled").lte("scheduledAt", args.now),
      )
      .collect();

    return duePosts;
  },
});

/**
 * Internal query to resolve an array of media ID strings to their
 * Convex storage URLs and metadata.
 *
 * The `mediaIds` on a post are stored as plain strings (not typed Convex IDs).
 * Each string is the `_id` of a document in the `media` table.
 * We look up each document, retrieve its `storageId`, and resolve the
 * public storage URL via `ctx.storage.getUrl()`.
 *
 * Returns an array where each element is either a ResolvedMedia object
 * or null (if the media record was not found or the URL could not be resolved).
 */
export const getMediaForPublishing = internalQuery({
  args: {
    mediaIds: v.array(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const results: Array<{
      mediaId: string;
      storageUrl: string;
      mimeType: string;
      filename: string;
      fileSize: number;
    } | null> = [];

    for (const mediaId of args.mediaIds) {
      try {
        // mediaIds are stored as strings but reference the `media` table
        const media = await ctx.db.get(mediaId as Id<"media">);
        if (!media) {
          console.warn(`Media record not found for ID: ${mediaId}`);
          results.push(null);
          continue;
        }

        const storageUrl = await ctx.storage.getUrl(media.storageId);
        if (!storageUrl) {
          console.warn(
            `Storage URL could not be resolved for media ${mediaId} (storageId: ${media.storageId})`,
          );
          results.push(null);
          continue;
        }

        results.push({
          mediaId,
          storageUrl,
          mimeType: media.mimeType,
          filename: media.filename,
          fileSize: media.fileSize,
        });
      } catch (err) {
        console.warn(
          `Error resolving media ${mediaId}:`,
          err instanceof Error ? err.message : err,
        );
        results.push(null);
      }
    }

    return results;
  },
});

// ─── Internal mutations ──────────────────────────────────────────────────────

/**
 * Internal mutation to update a post's publish status.
 */
export const updatePostStatus = internalMutation({
  args: {
    postId: v.id("posts"),
    status: v.union(
      v.literal("publishing"),
      v.literal("published"),
      v.literal("partially_published"),
      v.literal("failed"),
    ),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.status === "published" || args.status === "partially_published") {
      updates.publishedAt = Date.now();
    }
    if (args.failureReason !== undefined) {
      updates.failureReason = args.failureReason;
    }
    await ctx.db.patch(args.postId, updates);
  },
});

/**
 * Internal mutation to update a single platform post's status after publish attempt.
 */
export const updatePlatformPostStatus = internalMutation({
  args: {
    platformPostId: v.id("platformPosts"),
    status: v.union(v.literal("published"), v.literal("failed")),
    externalPostId: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.patch(args.platformPostId, {
      status: args.status,
      platformPostId: args.externalPostId,
      failureReason: args.failureReason,
      publishedAt: args.status === "published" ? Date.now() : undefined,
    });
  },
});

/**
 * Internal mutation to create platformPost records for each target platform.
 */
export const createPlatformPosts = internalMutation({
  args: {
    postId: v.id("posts"),
    socialAccounts: v.array(
      v.object({
        socialAccountId: v.id("socialAccounts"),
        platform: v.union(
          v.literal("instagram"),
          v.literal("facebook"),
          v.literal("twitter"),
          v.literal("linkedin"),
        ),
      }),
    ),
  },
  handler: async (ctx: any, args: any) => {
    const ids: string[] = [];
    for (const account of args.socialAccounts) {
      const id = await ctx.db.insert("platformPosts", {
        postId: args.postId,
        socialAccountId: account.socialAccountId,
        platform: account.platform,
        status: "pending",
      });
      ids.push(id);
    }
    return ids;
  },
});
