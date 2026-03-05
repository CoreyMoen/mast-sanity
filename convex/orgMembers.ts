/**
 * orgMembers.ts — Organization member management.
 *
 * Provides queries and mutations for listing team members,
 * changing roles, and removing members from an organization.
 */

import { v, ConvexError } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { resolveUser } from "./lib/auth";

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * List all members of the current user's organization.
 * Returns member records enriched with user profile data.
 */
export const listMyOrgMembers = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    // Find the user's first org membership
    const membership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .first();

    if (!membership) {
      // User is not part of any org — return just themselves as a solo member
      return {
        members: [
          {
            id: user._id,
            userId: user._id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            role: "admin" as const,
            isOwner: true,
            isCurrentUser: true,
            joinedAt: user.createdAt,
          },
        ],
        currentUserRole: "admin" as const,
        orgId: null,
      };
    }

    // Fetch all members for this org
    const orgMemberRecords = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId", (q: any) => q.eq("orgId", membership.orgId))
      .collect();

    // Fetch the org to determine the owner
    const org = await ctx.db.get(membership.orgId);

    // Enrich each member with user profile data
    const members = await Promise.all(
      orgMemberRecords.map(async (member: any) => {
        const memberUser = await ctx.db.get(member.userId);
        if (!memberUser) return null;

        return {
          id: member._id,
          userId: member.userId,
          name: memberUser.name,
          email: memberUser.email,
          imageUrl: memberUser.imageUrl,
          role: member.role,
          isOwner: org?.ownerId === memberUser.clerkId,
          isCurrentUser: member.userId === user._id,
          joinedAt: member.joinedAt,
        };
      }),
    );

    return {
      members: members.filter(Boolean),
      currentUserRole: membership.role,
      orgId: membership.orgId,
    };
  },
});

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Change the role of an organization member.
 * Only admins can change roles. Cannot change the owner's role.
 */
export const changeRole = mutation({
  args: {
    memberId: v.id("orgMembers"),
    newRole: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("creator"),
      v.literal("viewer"),
    ),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);

    // Fetch the target member record
    const targetMember = await ctx.db.get(args.memberId);
    if (!targetMember) throw new ConvexError({ code: "NOT_FOUND", message: "Member not found" });

    // Verify the current user is an admin of the same org
    const currentMember = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId_userId", (q: any) =>
        q.eq("orgId", targetMember.orgId).eq("userId", user._id),
      )
      .unique();

    if (!currentMember || currentMember.role !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only admins can change member roles",
      });
    }

    // Prevent changing the owner's role
    const org = await ctx.db.get(targetMember.orgId);
    const targetUser = await ctx.db.get(targetMember.userId);
    if (org && targetUser && org.ownerId === targetUser.clerkId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cannot change the organization owner's role",
      });
    }

    await ctx.db.patch(args.memberId, { role: args.newRole });
  },
});

/**
 * Remove a member from the organization.
 * Only admins can remove members. Cannot remove the owner.
 */
export const removeMember = mutation({
  args: {
    memberId: v.id("orgMembers"),
  },
  handler: async (ctx: any, args: any) => {
    const user = await resolveUser(ctx);

    // Fetch the target member record
    const targetMember = await ctx.db.get(args.memberId);
    if (!targetMember) throw new ConvexError({ code: "NOT_FOUND", message: "Member not found" });

    // Verify the current user is an admin of the same org
    const currentMember = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId_userId", (q: any) =>
        q.eq("orgId", targetMember.orgId).eq("userId", user._id),
      )
      .unique();

    if (!currentMember || currentMember.role !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only admins can remove members",
      });
    }

    // Prevent removing the owner
    const org = await ctx.db.get(targetMember.orgId);
    const targetUser = await ctx.db.get(targetMember.userId);
    if (org && targetUser && org.ownerId === targetUser.clerkId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cannot remove the organization owner",
      });
    }

    // Cannot remove yourself
    if (targetMember.userId === user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cannot remove yourself from the organization",
      });
    }

    await ctx.db.delete(args.memberId);
  },
});

/**
 * Add a member from a Clerk organizationMembership webhook.
 * Resolves the org and user by their Clerk IDs.
 */
export const addMemberFromWebhook = internalMutation({
  args: {
    clerkOrgId: v.string(),
    clerkUserId: v.string(),
    role: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    // Find the org by clerkOrgId
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q: any) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();
    if (!org) {
      console.warn(`[orgMembers] Org not found for clerkOrgId: ${args.clerkOrgId}`);
      return;
    }

    // Find the user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.clerkUserId))
      .unique();
    if (!user) {
      console.warn(`[orgMembers] User not found for clerkId: ${args.clerkUserId}`);
      return;
    }

    // Check if membership already exists
    const existing = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId_userId", (q: any) =>
        q.eq("orgId", org._id).eq("userId", user._id)
      )
      .unique();
    if (existing) return;

    // Map Clerk role to app role
    const appRole = args.role === "org:admin" ? "admin" : "editor";

    await ctx.db.insert("orgMembers", {
      orgId: org._id,
      userId: user._id,
      role: appRole,
      joinedAt: Date.now(),
    });
  },
});
