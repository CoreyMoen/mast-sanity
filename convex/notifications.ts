/**
 * notifications.ts — In-app notification system.
 *
 * Provides mutations and queries for creating, listing, and managing
 * in-app notifications. Each notification is linked to a user and
 * tracks read/unread status for the notification bell UI.
 */

import { v, ConvexError } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { resolveUser } from "./lib/auth";

// ─── Notification type validator (shared across functions) ──────────────────

const notificationType = v.union(
  v.literal("post_published"),
  v.literal("post_failed"),
  v.literal("approval_requested"),
  v.literal("post_approved"),
  v.literal("post_rejected"),
  v.literal("subscription_changed"),
  v.literal("credits_low"),
  v.literal("account_disconnected"),
);

// ─── Internal Mutations ─────────────────────────────────────────────────────

/**
 * Create a notification record (called from other Convex functions).
 * This is an internalMutation so it can be called from actions and
 * other server-side code without requiring auth.
 */
export const create = internalMutation({
  args: {
    userId: v.id("users"),
    type: notificationType,
    message: v.string(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      message: args.message,
      metadata: args.metadata,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * List recent notifications for the current user.
 * Returns up to 50 notifications, most recent first, including
 * both read and unread items.
 */
export const list = query({
  args: {},
  handler: async (ctx: any) => {
    let user;
    try { user = await resolveUser(ctx); } catch { return []; }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_createdAt", (q: any) =>
        q.eq("userId", user._id),
      )
      .order("desc")
      .take(50);

    return notifications;
  },
});

/**
 * Get the count of unread notifications for the current user.
 * Used for the notification bell badge.
 */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx: any) => {
    let user;
    try { user = await resolveUser(ctx); } catch { return 0; }

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q: any) =>
        q.eq("userId", user._id).eq("isRead", false),
      )
      .collect();

    return unread.length;
  },
});

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Mark a single notification as read.
 */
export const markRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new ConvexError({ code: "NOT_FOUND", message: "Notification not found" });

    // Ensure the notification belongs to the current user
    if (notification.userId !== user._id) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Not authorized" });
    }

    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

/**
 * Mark all notifications as read for the current user.
 */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx: any) => {
    const user = await resolveUser(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q: any) =>
        q.eq("userId", user._id).eq("isRead", false),
      )
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }

    return { markedCount: unread.length };
  },
});
