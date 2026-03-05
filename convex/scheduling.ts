/**
 * scheduling.ts — Post scheduling and immediate publishing functions.
 *
 * Provides mutations for scheduling, rescheduling, and canceling scheduled posts,
 * as well as an action for immediate publishing ("Publish Now").
 */

import { v, ConvexError } from "convex/values";
import { action, mutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

// ─── Schedule a post ─────────────────────────────────────────────────────────

/**
 * Schedule a post for future publishing.
 * Creates a new post or updates an existing one with status "scheduled".
 */
export const schedulePost = mutation({
  args: {
    postId: v.optional(v.id("posts")),
    content: v.string(),
    platforms: v.array(v.string()),
    mediaIds: v.array(v.string()),
    hashtags: v.array(v.string()),
    scheduledAt: v.number(),
    timezone: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    // Validate: scheduledAt must be in the future
    if (args.scheduledAt <= Date.now()) {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "Scheduled time must be in the future" });
    }

    // Validate: at least one platform selected
    if (args.platforms.length === 0) {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "At least one platform must be selected" });
    }

    // Validate: content must not be empty
    if (!args.content.trim()) {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "Post content cannot be empty" });
    }

    const now = Date.now();

    if (args.postId) {
      // Update an existing post
      const existing = await ctx.db.get(args.postId);
      if (!existing) throw new ConvexError({ code: "NOT_FOUND", message: "Post not found" });

      // Only allow scheduling from draft or failed status
      if (
        existing.status !== "draft" &&
        existing.status !== "failed" &&
        existing.status !== "scheduled"
      ) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: `Cannot schedule a post with status "${existing.status}"`,
        });
      }

      await ctx.db.patch(args.postId, {
        content: args.content.trim(),
        platforms: args.platforms,
        mediaIds: args.mediaIds,
        hashtags: args.hashtags,
        scheduledAt: args.scheduledAt,
        timezone: args.timezone,
        status: "scheduled",
        updatedAt: now,
      });

      return args.postId;
    }

    // Create a new scheduled post
    const postId = await ctx.db.insert("posts", {
      authorId: user._id,
      content: args.content.trim(),
      platforms: args.platforms,
      mediaIds: args.mediaIds,
      hashtags: args.hashtags,
      status: "scheduled",
      scheduledAt: args.scheduledAt,
      timezone: args.timezone,
      createdAt: now,
      updatedAt: now,
    });

    return postId;
  },
});

// ─── Reschedule a post ───────────────────────────────────────────────────────

/**
 * Update the scheduledAt time for a post that is already scheduled.
 */
export const reschedulePost = mutation({
  args: {
    postId: v.id("posts"),
    scheduledAt: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError({ code: "NOT_FOUND", message: "Post not found" });
    if (post.authorId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your post" });

    if (post.status !== "scheduled") {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: `Cannot reschedule a post with status "${post.status}". Only scheduled posts can be rescheduled.`,
      });
    }

    // Validate: new time must be in the future
    if (args.scheduledAt <= Date.now()) {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "New scheduled time must be in the future" });
    }

    await ctx.db.patch(args.postId, {
      scheduledAt: args.scheduledAt,
      updatedAt: Date.now(),
    });
  },
});

// ─── Cancel a scheduled post ─────────────────────────────────────────────────

/**
 * Cancel a scheduled post by moving it back to draft status.
 */
export const cancelScheduledPost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError({ code: "NOT_FOUND", message: "Post not found" });
    if (post.authorId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your post" });

    if (post.status !== "scheduled") {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: `Cannot cancel a post with status "${post.status}". Only scheduled posts can be canceled.`,
      });
    }

    await ctx.db.patch(args.postId, {
      status: "draft",
      scheduledAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

// ─── Publish Now ─────────────────────────────────────────────────────────────

/**
 * Immediately publish a post, bypassing the scheduler.
 * Creates the post (or uses an existing draft) and then calls the publish action.
 */
export const publishNow = action({
  args: {
    postId: v.optional(v.id("posts")),
    content: v.optional(v.string()),
    platforms: v.optional(v.array(v.string())),
    mediaIds: v.optional(v.array(v.string())),
    hashtags: v.optional(v.array(v.string())),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    let postId = args.postId;

    if (!postId) {
      // Create a new post as a draft first, then publish it
      if (!args.content?.trim()) {
        throw new ConvexError({ code: "VALIDATION_ERROR", message: "Post content is required" });
      }
      if (!args.platforms || args.platforms.length === 0) {
        throw new ConvexError({ code: "VALIDATION_ERROR", message: "At least one platform must be selected" });
      }

      postId = await ctx.runMutation(api.posts.create, {
        content: args.content.trim(),
        platforms: args.platforms,
        mediaIds: args.mediaIds ?? [],
        hashtags: args.hashtags ?? [],
        timezone: args.timezone ?? "UTC",
        status: "draft",
      });
    }

    // Publish the post using the internal action (no redundant auth check)
    const result = await ctx.runAction(
      internal.publishingActions.publishPostInternal,
      { postId },
    );

    return result;
  },
});
