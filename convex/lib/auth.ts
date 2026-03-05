/**
 * lib/auth.ts — Shared authentication helper for Convex functions.
 *
 * Provides a single resolveUser() utility that validates the caller's
 * identity via Clerk JWT and resolves their Convex user record.
 */

import { ConvexError } from "convex/values";

/**
 * Resolve the authenticated user from the Convex auth context.
 * Throws a structured ConvexError if the user is not authenticated
 * or their record is not found in the database.
 */
export async function resolveUser(ctx: { db: any; auth: any }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
  }

  return user;
}
