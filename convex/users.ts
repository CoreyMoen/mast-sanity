/**
 * users.ts — User management synced with Clerk.
 *
 * Handles user CRUD triggered by Clerk webhooks and provides
 * queries for the authenticated user's profile and settings.
 */

import { v, ConvexError } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";


/**
 * Internal query to fetch a user by their Convex document ID.
 * Used by other server-side functions (e.g., email notifications)
 * that already have the user ID and need the full record.
 */
export const getById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get the current authenticated user's profile.
 */
export const getMe = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const { encryptedApiKey, stripeCustomerId, ...safeUser } = user;
    return { ...safeUser, hasApiKey: !!encryptedApiKey };
  },
});

/**
 * Update the user's LLM provider and API key settings.
 */
export const updateLlmSettings = mutation({
  args: {
    llmProvider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("anthropic"),
    ),
    encryptedApiKey: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    await ctx.db.patch(user._id, {
      llmProvider: args.llmProvider,
      encryptedApiKey: args.encryptedApiKey,
    });
  },
});

/**
 * Mark the current user's onboarding as completed.
 */
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    await ctx.db.patch(user._id, {
      onboardingCompleted: true,
    });
  },
});

/**
 * Ensure the current authenticated user exists in the database.
 * Called from the dashboard layout on every page load.
 * If the user doesn't exist (e.g., webhook hasn't fired yet on localhost),
 * creates the user record from the Clerk identity data.
 * This is idempotent — safe to call repeatedly.
 */
export const ensureUser = mutation({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) return existing._id;

    // Create user from Clerk identity data
    const name =
      [identity.givenName, identity.familyName].filter(Boolean).join(" ") ||
      identity.name ||
      identity.email ||
      "User";

    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      name,
      imageUrl: identity.pictureUrl,
      subscriptionTier: "free",
      subscriptionStatus: "active",
      aiCreditsUsed: 0,
      aiCreditsLimit: 10, // Free tier: matches TIER_LIMITS.free.aiCreditsPerMonth
      llmProvider: "gemini",
      createdAt: Date.now(),
    });
  },
});

/**
 * Mutation to create a user from a Clerk webhook event.
 * Called by the Next.js Clerk webhook route after signature verification.
 */
export const createUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    // Check if user already exists (idempotency)
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      subscriptionTier: "free",
      subscriptionStatus: "active",
      aiCreditsUsed: 0,
      aiCreditsLimit: 10, // Free tier: matches TIER_LIMITS.free.aiCreditsPerMonth // Free tier default
      llmProvider: "gemini",
      createdAt: Date.now(),
    });
  },
});

/**
 * Mutation to update a user from a Clerk webhook event.
 * Called by the Next.js Clerk webhook route after signature verification.
 */
export const updateUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      console.error(`User not found for clerkId: ${args.clerkId}`);
      return;
    }

    await ctx.db.patch(user._id, {
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
    });
  },
});

/**
 * Mutation to soft-delete a user from a Clerk webhook event.
 * Called by the Next.js Clerk webhook route after signature verification.
 */
export const deleteUser = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return;

    // Deactivate social accounts
    const accounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .collect();

    for (const account of accounts) {
      await ctx.db.patch(account._id, { isActive: false });
    }

    // Delete the user record
    await ctx.db.delete(user._id);
  },
});
