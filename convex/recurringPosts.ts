/**
 * recurringPosts.ts — Recurring post rule engine.
 *
 * Manages recurring post schedules (daily, weekly, biweekly, monthly, custom).
 * The cron job calls processRecurringRules to generate new post instances
 * when their nextOccurrence arrives.
 */

import { v, ConvexError } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// ─── Tier check helper ───────────────────────────────────────────────────────

const TIERS_WITH_RECURRING = ["pro", "business"];

// ─── calculateNextOccurrence helper ──────────────────────────────────────────

/**
 * Given a current occurrence timestamp and a frequency configuration,
 * calculate the next occurrence as a UTC timestamp.
 *
 * For daily/weekly/biweekly/custom, we simply add a fixed interval.
 * For monthly, we advance to the same day-of-month next month (clamping
 * to end-of-month when needed).
 */
function calculateNextOccurrence(
  currentOccurrence: number,
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "custom",
  customIntervalDays?: number,
): number {
  const DAY_MS = 24 * 60 * 60 * 1000;

  if (frequency === "monthly") {
    const current = new Date(currentOccurrence);
    const year = current.getUTCFullYear();
    const month = current.getUTCMonth();
    const day = current.getUTCDate();
    const hours = current.getUTCHours();
    const minutes = current.getUTCMinutes();
    const seconds = current.getUTCSeconds();
    const ms = current.getUTCMilliseconds();

    // Advance to the next month
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    // Clamp to end of next month if needed
    const daysInNextMonth = new Date(
      Date.UTC(nextYear, nextMonth + 1, 0),
    ).getUTCDate();
    const clampedDay = Math.min(day, daysInNextMonth);

    return Date.UTC(nextYear, nextMonth, clampedDay, hours, minutes, seconds, ms);
  }

  // For all other frequencies, use a fixed interval in days
  const intervalDays = {
    daily: 1,
    weekly: 7,
    biweekly: 14,
    custom: customIntervalDays ?? 1,
  }[frequency];

  return currentOccurrence + intervalDays * DAY_MS;
}

/**
 * Preview the next N occurrences given a starting occurrence and frequency config.
 * Useful for showing users upcoming scheduled dates.
 */
function previewNextOccurrences(
  startOccurrence: number,
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "custom",
  customIntervalDays: number | undefined,
  count: number,
): number[] {
  const result: number[] = [];
  let current = startOccurrence;
  for (let i = 0; i < count; i++) {
    result.push(current);
    current = calculateNextOccurrence(current, frequency, customIntervalDays);
  }
  return result;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Create a new recurring post rule.
 * Validates frequency, calculates nextOccurrence.
 * Checks tier (Pro/Business only).
 */
export const create = mutation({
  args: {
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("biweekly"),
      v.literal("monthly"),
      v.literal("custom"),
    ),
    customIntervalDays: v.optional(v.number()),
    endType: v.union(
      v.literal("never"),
      v.literal("after_count"),
      v.literal("on_date"),
    ),
    endAfterCount: v.optional(v.number()),
    endOnDate: v.optional(v.number()),
    nextOccurrence: v.number(),
    templateContent: v.string(),
    templatePlatforms: v.array(v.string()),
    templateHashtags: v.array(v.string()),
    templateMediaIds: v.array(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    // Tier gate: only Pro and Business can use recurring posts
    if (!TIERS_WITH_RECURRING.includes(user.subscriptionTier)) {
      throw new ConvexError({
        code: "FEATURE_GATED",
        message:
          "Recurring posts are available on Pro and Business plans. Upgrade to unlock this feature.",
      });
    }

    // Validate custom frequency has an interval
    if (args.frequency === "custom" && !args.customIntervalDays) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Custom frequency requires a customIntervalDays value.",
      });
    }

    if (
      args.frequency === "custom" &&
      args.customIntervalDays !== undefined &&
      args.customIntervalDays < 1
    ) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Custom interval must be at least 1 day.",
      });
    }

    // Validate end type args
    if (args.endType === "after_count" && !args.endAfterCount) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "End after count requires an endAfterCount value.",
      });
    }

    if (args.endType === "on_date" && !args.endOnDate) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "End on date requires an endOnDate value.",
      });
    }

    // Validate template content is non-empty
    if (!args.templateContent.trim()) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Template content cannot be empty.",
      });
    }

    // Validate platforms are non-empty
    if (args.templatePlatforms.length === 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "At least one platform must be selected.",
      });
    }

    return await ctx.db.insert("recurringRules", {
      authorId: user._id,
      frequency: args.frequency,
      customIntervalDays: args.customIntervalDays,
      endType: args.endType,
      endAfterCount: args.endAfterCount,
      endOnDate: args.endOnDate,
      nextOccurrence: args.nextOccurrence,
      templateContent: args.templateContent,
      templatePlatforms: args.templatePlatforms,
      templateHashtags: args.templateHashtags,
      templateMediaIds: args.templateMediaIds,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

/**
 * Update an existing recurring rule's schedule or template.
 */
export const update = mutation({
  args: {
    ruleId: v.id("recurringRules"),
    frequency: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("biweekly"),
        v.literal("monthly"),
        v.literal("custom"),
      ),
    ),
    customIntervalDays: v.optional(v.number()),
    endType: v.optional(
      v.union(
        v.literal("never"),
        v.literal("after_count"),
        v.literal("on_date"),
      ),
    ),
    endAfterCount: v.optional(v.number()),
    endOnDate: v.optional(v.number()),
    nextOccurrence: v.optional(v.number()),
    templateContent: v.optional(v.string()),
    templatePlatforms: v.optional(v.array(v.string())),
    templateHashtags: v.optional(v.array(v.string())),
    templateMediaIds: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    const rule = await ctx.db.get(args.ruleId);
    if (!rule) throw new ConvexError({ code: "NOT_FOUND", message: "Recurring rule not found" });

    // Verify ownership
    if (rule.authorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only update your own recurring rules.",
      });
    }

    // Build the update payload, excluding undefined values
    const { ruleId: _ruleId, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined),
    );

    // Validate updated fields
    if (
      cleanUpdates.frequency === "custom" &&
      !cleanUpdates.customIntervalDays &&
      !rule.customIntervalDays
    ) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Custom frequency requires a customIntervalDays value.",
      });
    }

    if (
      cleanUpdates.templateContent !== undefined &&
      !(cleanUpdates.templateContent as string).trim()
    ) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Template content cannot be empty.",
      });
    }

    if (
      cleanUpdates.templatePlatforms !== undefined &&
      (cleanUpdates.templatePlatforms as string[]).length === 0
    ) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "At least one platform must be selected.",
      });
    }

    await ctx.db.patch(args.ruleId, cleanUpdates);
  },
});

/**
 * Soft-delete a recurring rule by deactivating it.
 */
export const deactivate = mutation({
  args: { ruleId: v.id("recurringRules") },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    const rule = await ctx.db.get(args.ruleId);
    if (!rule) throw new ConvexError({ code: "NOT_FOUND", message: "Recurring rule not found" });

    // Verify ownership
    if (rule.authorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only deactivate your own recurring rules.",
      });
    }

    await ctx.db.patch(args.ruleId, { isActive: false });
  },
});

/**
 * Re-activate a previously deactivated recurring rule.
 */
export const activate = mutation({
  args: { ruleId: v.id("recurringRules") },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    const rule = await ctx.db.get(args.ruleId);
    if (!rule) throw new ConvexError({ code: "NOT_FOUND", message: "Recurring rule not found" });

    // Verify ownership
    if (rule.authorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only activate your own recurring rules.",
      });
    }

    // Tier gate
    if (!TIERS_WITH_RECURRING.includes(user.subscriptionTier)) {
      throw new ConvexError({
        code: "FEATURE_GATED",
        message:
          "Recurring posts are available on Pro and Business plans. Upgrade to unlock this feature.",
      });
    }

    // If the nextOccurrence is in the past, advance it to the future
    let nextOccurrence = rule.nextOccurrence;
    const now = Date.now();
    while (nextOccurrence <= now) {
      nextOccurrence = calculateNextOccurrence(
        nextOccurrence,
        rule.frequency,
        rule.customIntervalDays,
      );
    }

    await ctx.db.patch(args.ruleId, { isActive: true, nextOccurrence });
  },
});

/**
 * Permanently delete a recurring rule.
 */
export const remove = mutation({
  args: { ruleId: v.id("recurringRules") },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    const rule = await ctx.db.get(args.ruleId);
    if (!rule) throw new ConvexError({ code: "NOT_FOUND", message: "Recurring rule not found" });

    // Verify ownership
    if (rule.authorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only delete your own recurring rules.",
      });
    }

    await ctx.db.delete(args.ruleId);
  },
});

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List all recurring rules for the authenticated user.
 */
export const list = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const rules = await ctx.db
      .query("recurringRules")
      .withIndex("by_authorId", (q: any) => q.eq("authorId", user._id))
      .collect();

    // For each rule, compute upcoming preview dates
    return rules.map((rule: any) => {
      const upcoming = previewNextOccurrences(
        rule.nextOccurrence,
        rule.frequency,
        rule.customIntervalDays,
        3,
      );

      // Count how many posts have been generated by this rule
      // (we skip this for performance; the UI can use a separate query if needed)

      return {
        ...rule,
        upcomingOccurrences: upcoming,
      };
    });
  },
});

/**
 * Get a single recurring rule by ID.
 */
export const get = query({
  args: { ruleId: v.id("recurringRules") },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const rule = await ctx.db.get(args.ruleId);
    if (!rule) return null;
    if (rule.authorId !== user._id) return null;

    const upcoming = previewNextOccurrences(
      rule.nextOccurrence,
      rule.frequency,
      rule.customIntervalDays,
      5,
    );

    return {
      ...rule,
      upcomingOccurrences: upcoming,
    };
  },
});

// ─── Internal: Cron job processor ────────────────────────────────────────────

/**
 * Internal mutation called by cron to process due recurring rules.
 * Generates new scheduled posts from templates and advances nextOccurrence.
 */
export const processRecurringRules = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    const now = Date.now();

    const dueRules = await ctx.db
      .query("recurringRules")
      .withIndex("by_isActive_nextOccurrence", (q: any) =>
        q.eq("isActive", true).lte("nextOccurrence", now),
      )
      .collect();

    let processedCount = 0;

    for (const rule of dueRules) {
      // Create a new scheduled post from the template
      await ctx.db.insert("posts", {
        authorId: rule.authorId,
        orgId: rule.orgId,
        content: rule.templateContent,
        platforms: rule.templatePlatforms,
        mediaIds: rule.templateMediaIds,
        hashtags: rule.templateHashtags,
        status: "scheduled",
        scheduledAt: rule.nextOccurrence,
        timezone: "UTC",
        recurringRuleId: rule._id,
        createdAt: now,
        updatedAt: now,
      });

      // Calculate next occurrence
      const nextOccurrence = calculateNextOccurrence(
        rule.nextOccurrence,
        rule.frequency,
        rule.customIntervalDays,
      );

      // Check if the rule should be deactivated
      let shouldDeactivate = false;

      // End on a specific date
      if (
        rule.endType === "on_date" &&
        rule.endOnDate &&
        nextOccurrence > rule.endOnDate
      ) {
        shouldDeactivate = true;
      }

      // End after N occurrences — count how many posts this rule has generated
      if (rule.endType === "after_count" && rule.endAfterCount) {
        const generatedPosts = await ctx.db
          .query("posts")
          .withIndex("by_recurringRuleId", (q: any) => q.eq("recurringRuleId", rule._id))
          .collect();

        // +1 because we just inserted a new post above
        if (generatedPosts.length >= rule.endAfterCount) {
          shouldDeactivate = true;
        }
      }

      if (shouldDeactivate) {
        await ctx.db.patch(rule._id, { isActive: false });
      } else {
        await ctx.db.patch(rule._id, { nextOccurrence });
      }

      processedCount++;
    }

    return { processedCount };
  },
});
