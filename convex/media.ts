/**
 * media.ts — Media upload and management.
 *
 * Handles file uploads to Convex storage, metadata tracking,
 * and media library CRUD operations.
 */

import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { resolveUser } from "./lib/auth";

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Generate a signed upload URL for client-side file upload.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save media metadata after a successful upload to Convex storage.
 */
export const upload = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);

    const mediaId = await ctx.db.insert("media", {
      uploaderId: user._id,
      storageId: args.storageId,
      filename: args.filename,
      mimeType: args.mimeType,
      fileSize: args.fileSize,
      width: args.width,
      height: args.height,
      tags: [],
      uploadedAt: Date.now(),
    });

    return mediaId;
  },
});

/**
 * Legacy alias — kept for backwards compatibility with older callers.
 */
export const saveMedia = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    tags: v.array(v.string()),
    folder: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);

    const mediaId = await ctx.db.insert("media", {
      uploaderId: user._id,
      storageId: args.storageId,
      filename: args.filename,
      mimeType: args.mimeType,
      fileSize: args.fileSize,
      width: args.width,
      height: args.height,
      tags: args.tags,
      folder: args.folder,
      uploadedAt: Date.now(),
    });

    return mediaId;
  },
});

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List media for the authenticated user with optional filters.
 * Returns results sorted by most recent first.
 */
export const list = query({
  args: {
    mimeTypeFilter: v.optional(v.string()),
    tagFilter: v.optional(v.string()),
    search: v.optional(v.string()),
    folder: v.optional(v.string()),
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

    const allMedia = await ctx.db
      .query("media")
      .withIndex("by_uploaderId", (q: any) => q.eq("uploaderId", user._id))
      .order("desc")
      .take(args.limit ?? 200);

    // Apply client-side filters
    let filtered = allMedia;

    // Filter by MIME type prefix (e.g. "image", "video", "application")
    if (args.mimeTypeFilter) {
      filtered = filtered.filter((m: any) =>
        m.mimeType.startsWith(args.mimeTypeFilter!),
      );
    }

    // Filter by tag
    if (args.tagFilter) {
      filtered = filtered.filter((m: any) =>
        m.tags.includes(args.tagFilter!),
      );
    }

    // Search by filename (case-insensitive substring match)
    if (args.search) {
      const query = args.search.toLowerCase();
      filtered = filtered.filter((m: any) =>
        m.filename.toLowerCase().includes(query),
      );
    }

    // Filter by folder
    if (args.folder) {
      filtered = filtered.filter((m: any) => m.folder === args.folder);
    }

    // Resolve storage URLs for each item
    const mediaWithUrls = await Promise.all(
      filtered.map(async (m: any) => ({
        ...m,
        url: await ctx.storage.getUrl(m.storageId),
        thumbnailUrl: m.thumbnailStorageId
          ? await ctx.storage.getUrl(m.thumbnailStorageId)
          : null,
      })),
    );

    return mediaWithUrls;
  },
});

/**
 * Get a single media item by ID with its resolved URL.
 */
export const get = query({
  args: { mediaId: v.id("media") },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);
    const media = await ctx.db.get(args.mediaId);
    if (!media) return null;
    if (media.uploaderId !== user._id) return null;

    return {
      ...media,
      url: await ctx.storage.getUrl(media.storageId),
      thumbnailUrl: media.thumbnailStorageId
        ? await ctx.storage.getUrl(media.thumbnailStorageId)
        : null,
    };
  },
});

/**
 * Update tags or filename for a media item.
 */
export const update = mutation({
  args: {
    mediaId: v.id("media"),
    filename: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);
    const existing = await ctx.db.get(args.mediaId);
    if (!existing) throw new ConvexError({ code: "NOT_FOUND", message: "Media not found" });
    if (existing.uploaderId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your media" });

    const updates: Record<string, unknown> = {};
    if (args.filename !== undefined) updates.filename = args.filename;
    if (args.tags !== undefined) updates.tags = args.tags;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.mediaId, updates);
    }
  },
});

/**
 * Delete a media item and its associated storage file.
 */
export const remove = mutation({
  args: { mediaId: v.id("media") },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);
    const media = await ctx.db.get(args.mediaId);
    if (!media) throw new ConvexError({ code: "NOT_FOUND", message: "Media not found" });
    if (media.uploaderId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your media" });

    await ctx.storage.delete(media.storageId);
    if (media.thumbnailStorageId) {
      await ctx.storage.delete(media.thumbnailStorageId);
    }

    await ctx.db.delete(args.mediaId);
  },
});

/**
 * Bulk delete multiple media items at once.
 */
export const bulkDelete = mutation({
  args: {
    mediaIds: v.array(v.id("media")),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);
    let deletedCount = 0;

    for (const mediaId of args.mediaIds) {
      const media = await ctx.db.get(mediaId);
      if (!media) continue;
      if (media.uploaderId !== user._id) continue;

      await ctx.storage.delete(media.storageId);
      if (media.thumbnailStorageId) {
        await ctx.storage.delete(media.thumbnailStorageId);
      }

      await ctx.db.delete(mediaId);
      deletedCount++;
    }

    return { deletedCount };
  },
});

/**
 * Add a tag to a media item (no-op if tag already exists).
 */
export const addTag = mutation({
  args: {
    mediaId: v.id("media"),
    tag: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);
    const media = await ctx.db.get(args.mediaId);
    if (!media) throw new ConvexError({ code: "NOT_FOUND", message: "Media not found" });
    if (media.uploaderId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your media" });

    const normalizedTag = args.tag.trim().toLowerCase();
    if (!normalizedTag) throw new ConvexError({ code: "VALIDATION_ERROR", message: "Tag cannot be empty" });

    if (media.tags.includes(normalizedTag)) return;

    await ctx.db.patch(args.mediaId, {
      tags: [...media.tags, normalizedTag],
    });
  },
});

/**
 * Remove a tag from a media item.
 */
export const removeTag = mutation({
  args: {
    mediaId: v.id("media"),
    tag: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);
    const media = await ctx.db.get(args.mediaId);
    if (!media) throw new ConvexError({ code: "NOT_FOUND", message: "Media not found" });
    if (media.uploaderId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your media" });

    const normalizedTag = args.tag.trim().toLowerCase();

    await ctx.db.patch(args.mediaId, {
      tags: media.tags.filter((t: string) => t !== normalizedTag),
    });
  },
});

/**
 * Bulk add a tag to multiple media items.
 */
export const bulkAddTag = mutation({
  args: {
    mediaIds: v.array(v.id("media")),
    tag: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const normalizedTag = args.tag.trim().toLowerCase();
    if (!normalizedTag) throw new ConvexError({ code: "VALIDATION_ERROR", message: "Tag cannot be empty" });

    const user = await resolveUser(ctx);

    for (const mediaId of args.mediaIds) {
      const media = await ctx.db.get(mediaId);
      if (!media) continue;
      if (media.uploaderId !== user._id) continue;
      if (media.tags.includes(normalizedTag)) continue;

      await ctx.db.patch(mediaId, {
        tags: [...media.tags, normalizedTag],
      });
    }
  },
});
