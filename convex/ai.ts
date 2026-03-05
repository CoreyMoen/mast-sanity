/**
 * ai.ts — LLM integration for AI-powered features.
 *
 * Provides caption generation, content rewriting, and hashtag suggestions
 * using the user's configured LLM provider (Gemini, OpenAI, or Anthropic).
 * Delegates usage tracking to aiUsage.ts for credit metering.
 */

import { v, ConvexError } from "convex/values";
import { action, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { createLLMProvider } from "../lib/llm/index";
import type { Tone, Platform, CaptionOptions } from "../lib/llm/types";
import { TIER_CREDIT_LIMITS } from "./constants";

const CREDITS_EXHAUSTED_ERROR =
  "You've used all your AI credits for this month. Upgrade your plan for more credits, or wait for your credits to reset at the start of next month.";

/**
 * Generate social media caption suggestions using the user's configured LLM.
 *
 * Returns an array of caption strings (default 3).
 * Each call consumes 1 AI credit.
 */
export const generateCaption = action({
  args: {
    prompt: v.string(),
    platform: v.string(),
    tone: v.optional(v.string()),
    platforms: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    maxLength: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    // Fetch user to get their LLM config and credit balance
    const user = await ctx.runQuery(internal.ai.getUserForAi, {
      clerkId: identity.subject,
    });
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    // Check credits (business tier is unlimited)
    const _tierKey = (user.subscriptionTier ?? "free") as keyof typeof TIER_CREDIT_LIMITS;
    const _tierCreditLimit = TIER_CREDIT_LIMITS[_tierKey] ?? TIER_CREDIT_LIMITS.free;
    if (_tierCreditLimit !== Infinity && user.aiCreditsUsed >= _tierCreditLimit) {
      throw new ConvexError({ code: "CREDITS_EXHAUSTED", message: CREDITS_EXHAUSTED_ERROR });
    }

    // Rate limit check
    const rateLimit = await ctx.runMutation(internal.rateLimits.checkAndIncrement, {
      key: `ai:${user._id}`,
      category: "ai",
    });
    if (!rateLimit.allowed) {
      throw new ConvexError({ code: "RATE_LIMITED", message: "Too many AI requests. Please try again shortly." });
    }

    // Resolve the user's API key — fall back to env var in development
    const ENV_KEY_MAP: Record<string, string | undefined> = {
      gemini: process.env.GEMINI_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
    };
    const apiKey = user.encryptedApiKey || ENV_KEY_MAP[user.llmProvider];
    if (!apiKey) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "No API key configured. Please add your LLM API key in Settings.",
      });
    }

    // Create the LLM provider using the factory
    const provider = createLLMProvider(
      user.llmProvider as "gemini" | "openai" | "anthropic",
      apiKey,
    );

    // Build caption options
    const captionOptions: CaptionOptions = {
      tone: (args.tone as Tone) ?? "casual",
      platforms: (args.platforms as Platform[]) ?? [args.platform as Platform],
      language: args.language ?? "en",
      maxSuggestions: 3,
    };

    // Call the LLM provider
    const suggestions = await provider.generateCaption(
      args.prompt,
      captionOptions,
    );

    // Log the usage via aiUsage module (1 credit per generation call)
    await ctx.runMutation(internal.aiUsage.logUsage, {
      userId: user._id,
      action: "generate",
      provider: user.llmProvider,
      inputTokens: 0,
      outputTokens: 0,
    });

    return { suggestions };
  },
});

/**
 * Rewrite existing content with a different tone or style.
 *
 * Returns an array of 3 rewritten variations.
 * Each call consumes 1 AI credit.
 */
export const rewriteContent = action({
  args: {
    content: v.string(),
    style: v.string(),
    platform: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.runQuery(internal.ai.getUserForAi, {
      clerkId: identity.subject,
    });
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    if (
      user.subscriptionTier !== "business" &&
      user.aiCreditsUsed >= user.aiCreditsLimit
    ) {
      throw new ConvexError({ code: "CREDITS_EXHAUSTED", message: CREDITS_EXHAUSTED_ERROR });
    }

    // Rate limit check
    const rateLimit = await ctx.runMutation(internal.rateLimits.checkAndIncrement, {
      key: `ai:${user._id}`,
      category: "ai",
    });
    if (!rateLimit.allowed) {
      throw new ConvexError({ code: "RATE_LIMITED", message: "Too many AI requests. Please try again shortly." });
    }

    const _envKeys: Record<string, string | undefined> = {
      gemini: process.env.GEMINI_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
    };
    const apiKey = user.encryptedApiKey || _envKeys[user.llmProvider];
    if (!apiKey) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "No API key configured. Please add your LLM API key in Settings.",
      });
    }

    const provider = createLLMProvider(
      user.llmProvider as "gemini" | "openai" | "anthropic",
      apiKey,
    );

    // Validate tone value, default to casual if unrecognized
    const validTones: Tone[] = [
      "casual",
      "professional",
      "humorous",
      "inspirational",
      "promotional",
    ];
    const tone: Tone = validTones.includes(args.style as Tone)
      ? (args.style as Tone)
      : "casual";

    const variations = await provider.rewriteCaption(args.content, tone);

    await ctx.runMutation(internal.aiUsage.logUsage, {
      userId: user._id,
      action: "rewrite",
      provider: user.llmProvider,
      inputTokens: 0,
      outputTokens: 0,
    });

    return { variations };
  },
});

/**
 * Suggest hashtags for given content.
 *
 * Returns an array of hashtag strings (without # prefix).
 * Each call consumes 1 AI credit.
 */
export const suggestHashtags = action({
  args: {
    content: v.string(),
    platform: v.string(),
    count: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.runQuery(internal.ai.getUserForAi, {
      clerkId: identity.subject,
    });
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    if (
      user.subscriptionTier !== "business" &&
      user.aiCreditsUsed >= user.aiCreditsLimit
    ) {
      throw new ConvexError({ code: "CREDITS_EXHAUSTED", message: CREDITS_EXHAUSTED_ERROR });
    }

    // Rate limit check
    const rateLimit = await ctx.runMutation(internal.rateLimits.checkAndIncrement, {
      key: `ai:${user._id}`,
      category: "ai",
    });
    if (!rateLimit.allowed) {
      throw new ConvexError({ code: "RATE_LIMITED", message: "Too many AI requests. Please try again shortly." });
    }

    const _envKeys: Record<string, string | undefined> = {
      gemini: process.env.GEMINI_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
    };
    const apiKey = user.encryptedApiKey || _envKeys[user.llmProvider];
    if (!apiKey) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "No API key configured. Please add your LLM API key in Settings.",
      });
    }

    const provider = createLLMProvider(
      user.llmProvider as "gemini" | "openai" | "anthropic",
      apiKey,
    );

    const hashtags = await provider.suggestHashtags(args.content);

    await ctx.runMutation(internal.aiUsage.logUsage, {
      userId: user._id,
      action: "hashtags",
      provider: user.llmProvider,
      inputTokens: 0,
      outputTokens: 0,
    });

    return { hashtags };
  },
});

/**
 * Get AI usage stats for the current billing period.
 */
export const getUsageStats = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const tierKey = (user.subscriptionTier ?? "free") as keyof typeof TIER_CREDIT_LIMITS;
    const tierLimit = TIER_CREDIT_LIMITS[tierKey] ?? TIER_CREDIT_LIMITS.free;

    return {
      creditsUsed: user.aiCreditsUsed,
      creditsLimit: tierLimit === Infinity ? -1 : tierLimit,
      provider: user.llmProvider,
      tier: user.subscriptionTier,
    };
  },
});

/**
 * Internal query to fetch user data for AI operations.
 */
export const getUserForAi = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});
