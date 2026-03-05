/**
 * posts.ts — Post CRUD and scheduling logic.
 *
 * Handles creating, reading, updating, and deleting posts.
 * Manages post status transitions (draft -> scheduled -> publishing -> published).
 */

import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { enforcePostLimit } from "./featureGates";
import { resolveUser } from "./lib/auth";

/**
 * Create a new post (draft or scheduled).
 */
export const create = mutation({
  args: {
    content: v.string(),
    platforms: v.array(v.string()),
    mediaIds: v.array(v.string()),
    hashtags: v.array(v.string()),
    scheduledAt: v.optional(v.number()),
    timezone: v.string(),
    status: v.union(v.literal("draft"), v.literal("scheduled")),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    // Enforce subscription tier post limit
    await enforcePostLimit(ctx.db, user._id, user.subscriptionTier);

    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      authorId: user._id,
      content: args.content,
      platforms: args.platforms,
      mediaIds: args.mediaIds,
      hashtags: args.hashtags,
      status: args.status,
      scheduledAt: args.scheduledAt,
      timezone: args.timezone,
      createdAt: now,
      updatedAt: now,
    });

    return postId;
  },
});

/**
 * List posts for the authenticated user with optional status filter.
 */
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("pending_approval"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("changes_requested"),
        v.literal("scheduled"),
        v.literal("publishing"),
        v.literal("published"),
        v.literal("partially_published"),
        v.literal("failed"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const postsQuery = ctx.db
      .query("posts")
      .withIndex("by_authorId", (q: any) => q.eq("authorId", user._id));

    const posts = await postsQuery
      .order("desc")
      .take(args.limit ?? 50);

    if (args.status) {
      return posts.filter((p: any) => p.status === args.status);
    }
    return posts;
  },
});

/**
 * Get a single post by ID.
 */
export const get = query({
  args: { postId: v.id("posts") },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) return null;
    if (post.authorId !== user._id) return null;
    return post;
  },
});

/**
 * Update post content and metadata.
 */
export const update = mutation({
  args: {
    postId: v.id("posts"),
    content: v.optional(v.string()),
    platforms: v.optional(v.array(v.string())),
    mediaIds: v.optional(v.array(v.string())),
    hashtags: v.optional(v.array(v.string())),
    scheduledAt: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("pending_approval"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("changes_requested"),
        v.literal("scheduled"),
      ),
    ),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);
    const { postId, ...updates } = args;
    const existing = await ctx.db.get(postId);
    if (!existing) throw new ConvexError({ code: "NOT_FOUND", message: "Post not found" });
    if (existing.authorId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your post" });

    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );

    await ctx.db.patch(postId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a post and its associated platform posts.
 */
export const remove = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError({ code: "NOT_FOUND", message: "Post not found" });
    if (post.authorId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your post" });

    // Delete associated platform posts
    const platformPosts = await ctx.db
      .query("platformPosts")
      .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
      .collect();

    for (const pp of platformPosts) {
      await ctx.db.delete(pp._id);
    }

    await ctx.db.delete(args.postId);
  },
});

/**
 * Duplicate a post as a new draft.
 */
export const duplicate = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    await enforcePostLimit(ctx.db, user._id, user.subscriptionTier);

    const original = await ctx.db.get(args.postId);
    if (!original) throw new ConvexError({ code: "NOT_FOUND", message: "Post not found" });
    if (original.authorId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your post" });

    const now = Date.now();
    return await ctx.db.insert("posts", {
      authorId: user._id,
      content: original.content,
      platforms: original.platforms,
      mediaIds: original.mediaIds,
      hashtags: original.hashtags,
      status: "draft" as const,
      timezone: original.timezone,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * List posts scheduled within a date range (for calendar view).
 */
export const listScheduled = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_authorId_scheduledAt", (q: any) =>
        q.eq("authorId", user._id).gte("scheduledAt", args.startDate).lte("scheduledAt", args.endDate),
      )
      .collect();

    return posts;
  },
});
