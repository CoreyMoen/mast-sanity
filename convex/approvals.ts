/**
 * approvals.ts — Approval workflow logic.
 *
 * Manages the post approval pipeline for team/org workflows.
 * Posts can be submitted for approval, approved, rejected, or
 * returned for changes by users with the appropriate role (admin or editor).
 */

import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveUser } from "./lib/auth";

/**
 * Assert the user has an admin or editor role in the post's org.
 * Returns the orgMember record.
 */
async function assertApproverRole(ctx: { db: any }, userId: string, orgId: string | undefined) {
  if (!orgId) throw new ConvexError({ code: "VALIDATION_ERROR", message: "Post must belong to an organization for approval workflows" });

  const member = await ctx.db
    .query("orgMembers")
    .withIndex("by_orgId_userId", (q: any) => q.eq("orgId", orgId).eq("userId", userId))
    .unique();

  if (!member) throw new ConvexError({ code: "FORBIDDEN", message: "You are not a member of this organization" });
  if (member.role !== "admin" && member.role !== "editor") {
    throw new ConvexError({ code: "FORBIDDEN", message: "Only admins and editors can review posts" });
  }

  return member;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Submit a post for approval (changes status to "pending_approval").
 * Creates an approval event to track the submission.
 */
export const submitForApproval = mutation({
  args: {
    postId: v.id("posts"),
    note: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError({ code: "NOT_FOUND", message: "Post not found" });
    if (post.authorId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your post" });

    if (post.status !== "draft" && post.status !== "changes_requested" && post.status !== "rejected") {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "Only draft, rejected, or changes-requested posts can be submitted for approval" });
    }

    // Update the post status
    await ctx.db.patch(args.postId, {
      status: "pending_approval" as const,
      approvalNote: args.note,
      updatedAt: Date.now(),
    });

    // Create an approval event
    await ctx.db.insert("approvalEvents", {
      postId: args.postId,
      orgId: post.orgId,
      actorId: user._id,
      action: "submitted" as const,
      note: args.note,
      createdAt: Date.now(),
    });

    // Schedule email to approvers (best effort, non-blocking)
    // Find org admins/editors who should receive approval requests
    if (post.orgId) {
      const approvers = await ctx.db
        .query("orgMembers")
        .withIndex("by_orgId", (q: any) => q.eq("orgId", post.orgId))
        .collect();

      const adminsAndEditors = approvers.filter(
        (m: any) => m.role === "admin" || m.role === "editor"
      );

      const postTitle = post.content.slice(0, 60) + (post.content.length > 60 ? "..." : "");

      for (const approver of adminsAndEditors) {
        const approverUser = await ctx.db.get(approver.userId);
        if (approverUser?.email && approver.userId !== user._id) {
          await ctx.scheduler.runAfter(0, internal.emailActions.sendApprovalRequestEmail, {
            toEmail: approverUser.email,
            postTitle,
            submitterName: user.name,
          });
        }
      }
    }
  },
});

/**
 * Approve a pending post.
 * Changes status to "scheduled" if the post has a scheduledAt, otherwise "approved".
 * Records the approver and an optional note.
 */
export const approve = mutation({
  args: {
    postId: v.id("posts"),
    note: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError({ code: "NOT_FOUND", message: "Post not found" });

    if (post.status !== "pending_approval") {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "Post is not pending approval" });
    }

    // Verify the approver has admin/editor role in the org
    await assertApproverRole(ctx, user._id, post.orgId);

    // If the post has a scheduled time, move it directly to "scheduled"
    const newStatus = post.scheduledAt ? "scheduled" : "approved";

    await ctx.db.patch(args.postId, {
      status: newStatus as any,
      approvedBy: user._id,
      approvalNote: args.note ?? post.approvalNote,
      updatedAt: Date.now(),
    });

    // Create an approval event
    await ctx.db.insert("approvalEvents", {
      postId: args.postId,
      orgId: post.orgId,
      actorId: user._id,
      action: "approved" as const,
      note: args.note,
      createdAt: Date.now(),
    });

    // Schedule email to post author (best effort)
    const postAuthor = await ctx.db.get(post.authorId);
    if (postAuthor?.email) {
      await ctx.scheduler.runAfter(0, internal.emailActions.sendPostApprovedEmail, {
        toEmail: postAuthor.email,
        postTitle: post.content.slice(0, 60) + (post.content.length > 60 ? "..." : ""),
        approverName: user.name,
      });
    }
  },
});

/**
 * Reject a pending post.
 * Changes status to "rejected" and records the rejection reason.
 * A reason is required for rejections.
 */
export const reject = mutation({
  args: {
    postId: v.id("posts"),
    reason: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);

    if (!args.reason.trim()) {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "A reason is required when rejecting a post" });
    }

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError({ code: "NOT_FOUND", message: "Post not found" });

    if (post.status !== "pending_approval") {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "Post is not pending approval" });
    }

    // Verify the rejector has admin/editor role in the org
    await assertApproverRole(ctx, user._id, post.orgId);

    await ctx.db.patch(args.postId, {
      status: "rejected" as const,
      approvalNote: args.reason,
      updatedAt: Date.now(),
    });

    // Create an approval event
    await ctx.db.insert("approvalEvents", {
      postId: args.postId,
      orgId: post.orgId,
      actorId: user._id,
      action: "rejected" as const,
      note: args.reason,
      createdAt: Date.now(),
    });
  },
});

/**
 * Request changes on a pending post.
 * Changes status to "changes_requested" and records the feedback.
 */
export const requestChanges = mutation({
  args: {
    postId: v.id("posts"),
    feedback: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);

    if (!args.feedback.trim()) {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "Feedback is required when requesting changes" });
    }

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError({ code: "NOT_FOUND", message: "Post not found" });

    if (post.status !== "pending_approval") {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "Post is not pending approval" });
    }

    // Verify the reviewer has admin/editor role in the org
    await assertApproverRole(ctx, user._id, post.orgId);

    await ctx.db.patch(args.postId, {
      status: "changes_requested" as const,
      approvalNote: args.feedback,
      updatedAt: Date.now(),
    });

    // Create an approval event
    await ctx.db.insert("approvalEvents", {
      postId: args.postId,
      orgId: post.orgId,
      actorId: user._id,
      action: "changes_requested" as const,
      note: args.feedback,
      createdAt: Date.now(),
    });
  },
});

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * List all posts pending approval for the current user's organization.
 * Admins and editors see all pending posts in their org.
 * Enriches each post with the author's name.
 */
export const listPendingApprovals = query({
  args: {
    orgId: v.optional(v.id("organizations")),
    statusFilter: v.optional(
      v.union(
        v.literal("pending_approval"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("changes_requested"),
        v.literal("all"),
      ),
    ),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    // Determine which org to query for
    let orgId = args.orgId;

    // If no orgId specified, find the user's first org membership
    if (!orgId) {
      const membership = await ctx.db
        .query("orgMembers")
        .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
        .first();
      if (membership) {
        orgId = membership.orgId;
      }
    }

    // Verify user has approver role if filtering by org
    if (orgId) {
      const member = await ctx.db
        .query("orgMembers")
        .withIndex("by_orgId_userId", (q: any) => q.eq("orgId", orgId).eq("userId", user._id))
        .unique();

      // Only admins and editors can see the approval queue
      if (!member || (member.role !== "admin" && member.role !== "editor")) {
        return [];
      }
    }

    // Fetch posts based on status filter
    const filter = args.statusFilter ?? "pending_approval";
    let posts;

    if (filter === "all") {
      // Get all posts that have been through the approval workflow
      if (orgId) {
        posts = await ctx.db
          .query("posts")
          .withIndex("by_orgId", (q: any) => q.eq("orgId", orgId))
          .order("desc")
          .collect();
        posts = posts.filter(
          (p: any) =>
            p.status === "pending_approval" ||
            p.status === "approved" ||
            p.status === "rejected" ||
            p.status === "changes_requested",
        );
      } else {
        const pending = await ctx.db
          .query("posts")
          .withIndex("by_status", (q: any) => q.eq("status", "pending_approval"))
          .order("desc")
          .collect();
        const approved = await ctx.db
          .query("posts")
          .withIndex("by_status", (q: any) => q.eq("status", "approved"))
          .order("desc")
          .collect();
        const rejected = await ctx.db
          .query("posts")
          .withIndex("by_status", (q: any) => q.eq("status", "rejected"))
          .order("desc")
          .collect();
        const changesReq = await ctx.db
          .query("posts")
          .withIndex("by_status", (q: any) => q.eq("status", "changes_requested"))
          .order("desc")
          .collect();
        posts = [...pending, ...approved, ...rejected, ...changesReq];
      }
    } else {
      if (orgId) {
        posts = await ctx.db
          .query("posts")
          .withIndex("by_orgId", (q: any) => q.eq("orgId", orgId))
          .order("desc")
          .collect();
        posts = posts.filter((p: any) => p.status === filter);
      } else {
        posts = await ctx.db
          .query("posts")
          .withIndex("by_status", (q: any) => q.eq("status", filter))
          .order("desc")
          .collect();
      }
    }

    // Enrich posts with author information
    const enrichedPosts = await Promise.all(
      posts.map(async (post: any) => {
        const author = await ctx.db.get(post.authorId);
        return {
          ...post,
          authorName: author?.name ?? "Unknown",
          authorEmail: author?.email ?? "",
        };
      }),
    );

    return enrichedPosts;
  },
});

/**
 * Get the full approval history for a specific post.
 * Returns all approval events in chronological order with actor names.
 */
export const getApprovalHistory = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    // Verify the user is the post author or an org member
    const post = await ctx.db.get(args.postId);
    if (!post) return [];
    if (post.authorId !== user._id) {
      // Check if the user is an org member of the post's org
      if (post.orgId) {
        const member = await ctx.db
          .query("orgMembers")
          .withIndex("by_orgId_userId", (q: any) => q.eq("orgId", post.orgId).eq("userId", user._id))
          .unique();
        if (!member) return [];
      } else {
        return [];
      }
    }

    const events = await ctx.db
      .query("approvalEvents")
      .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
      .order("asc")
      .collect();

    // Enrich events with actor names
    const enrichedEvents = await Promise.all(
      events.map(async (event: any) => {
        const actor = await ctx.db.get(event.actorId);
        return {
          ...event,
          actorName: actor?.name ?? "Unknown",
          actorEmail: actor?.email ?? "",
        };
      }),
    );

    return enrichedEvents;
  },
});

/**
 * Count pending approvals for the current user's organization.
 * Used for sidebar badge count.
 */
export const countPending = query({
  args: {
    orgId: v.optional(v.id("organizations")),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return 0;

    let orgId = args.orgId;

    if (!orgId) {
      const membership = await ctx.db
        .query("orgMembers")
        .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
        .first();
      if (membership) {
        orgId = membership.orgId;
      }
    }

    if (orgId) {
      const member = await ctx.db
        .query("orgMembers")
        .withIndex("by_orgId_userId", (q: any) => q.eq("orgId", orgId).eq("userId", user._id))
        .unique();

      if (!member || (member.role !== "admin" && member.role !== "editor")) {
        return 0;
      }

      const posts = await ctx.db
        .query("posts")
        .withIndex("by_orgId", (q: any) => q.eq("orgId", orgId))
        .collect();
      return posts.filter((p: any) => p.status === "pending_approval").length;
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status", (q: any) => q.eq("status", "pending_approval"))
      .collect();
    return posts.length;
  },
});

// Keep backward compat with the old listPending export name
export const listPending = listPendingApprovals;
