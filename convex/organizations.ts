/**
 * organizations.ts — Organization management.
 *
 * Handles creating and syncing organizations from Clerk webhooks.
 */

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Create or update an organization from a Clerk webhook.
 * Idempotent — safe to call multiple times for the same org.
 */
export const createFromWebhook = internalMutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    ownerId: v.string(), // Clerk user ID of the org creator
  },
  handler: async (ctx: any, args: any) => {
    // Check if org already exists
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q: any) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();

    if (existing) {
      // Update name if changed
      await ctx.db.patch(existing._id, { name: args.name });
      return existing._id;
    }

    // Create new org
    return await ctx.db.insert("organizations", {
      clerkOrgId: args.clerkOrgId,
      name: args.name,
      ownerId: args.ownerId,
      subscriptionTier: "free",
      createdAt: Date.now(),
    });
  },
});
