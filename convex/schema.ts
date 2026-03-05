import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Users ───────────────────────────────────────────────────────────────────
  // Mirrors Clerk user data with subscription and AI credit tracking.
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    stripeCustomerId: v.optional(v.string()),
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("business"),
    ),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
    ),
    aiCreditsUsed: v.number(),
    aiCreditsLimit: v.number(),
    llmProvider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("anthropic"),
    ),
    encryptedApiKey: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),

  // ─── Organizations ───────────────────────────────────────────────────────────
  // Team/org entities synced from Clerk organizations.
  organizations: defineTable({
    clerkOrgId: v.string(),
    name: v.string(),
    ownerId: v.string(),
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("business"),
    ),
    stripeSubscriptionId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerkOrgId", ["clerkOrgId"]),

  // ─── Organization Members ───────────────────────────────────────────────────
  // Maps users to organizations with role-based access.
  orgMembers: defineTable({
    orgId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("creator"),
      v.literal("viewer"),
    ),
    joinedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_userId", ["userId"])
    .index("by_orgId_userId", ["orgId", "userId"]),

  // ─── Social Accounts ────────────────────────────────────────────────────────
  // Connected social media accounts with OAuth tokens.
  socialAccounts: defineTable({
    userId: v.id("users"),
    orgId: v.optional(v.id("organizations")),
    platform: v.union(
      v.literal("instagram"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("linkedin"),
    ),
    platformAccountId: v.string(),
    accountName: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    profileImageUrl: v.optional(v.string()),
    isActive: v.boolean(),
    connectedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_orgId", ["orgId"])
    .index("by_platform_platformAccountId", ["platform", "platformAccountId"])
    .index("by_isActive_tokenExpiresAt", ["isActive", "tokenExpiresAt"]),

  // ─── Posts ───────────────────────────────────────────────────────────────────
  // Core content entity — draft, scheduled, or published posts.
  posts: defineTable({
    authorId: v.id("users"),
    orgId: v.optional(v.id("organizations")),
    content: v.string(),
    platforms: v.array(v.string()),
    mediaIds: v.array(v.string()),
    hashtags: v.array(v.string()),
    status: v.union(
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
    scheduledAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    timezone: v.string(),
    recurringRuleId: v.optional(v.id("recurringRules")),
    approvalNote: v.optional(v.string()),
    approvedBy: v.optional(v.id("users")),
    failureReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_authorId", ["authorId"])
    .index("by_orgId", ["orgId"])
    .index("by_scheduledAt", ["scheduledAt"])
    .index("by_status", ["status"])
    .index("by_status_scheduledAt", ["status", "scheduledAt"])
    .index("by_recurringRuleId", ["recurringRuleId"])
    .index("by_authorId_scheduledAt", ["authorId", "scheduledAt"]),

  // ─── Platform Posts ──────────────────────────────────────────────────────────
  // Per-platform publish status for each post.
  platformPosts: defineTable({
    postId: v.id("posts"),
    socialAccountId: v.id("socialAccounts"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("linkedin"),
    ),
    platformPostId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("published"),
      v.literal("failed"),
    ),
    failureReason: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
  })
    .index("by_postId", ["postId"])
    .index("by_socialAccountId", ["socialAccountId"]),

  // ─── Recurring Rules ─────────────────────────────────────────────────────────
  // Defines recurring post schedules and templates.
  recurringRules: defineTable({
    authorId: v.id("users"),
    orgId: v.optional(v.id("organizations")),
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
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_authorId", ["authorId"])
    .index("by_isActive_nextOccurrence", ["isActive", "nextOccurrence"]),

  // ─── Media ───────────────────────────────────────────────────────────────────
  // Uploaded media files stored in Convex file storage.
  media: defineTable({
    uploaderId: v.id("users"),
    orgId: v.optional(v.id("organizations")),
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    tags: v.array(v.string()),
    folder: v.optional(v.string()),
    uploadedAt: v.number(),
  })
    .index("by_uploaderId", ["uploaderId"])
    .index("by_orgId", ["orgId"])
    .index("by_folder", ["folder"]),

  // ─── Post Analytics ──────────────────────────────────────────────────────────
  // Per-post engagement metrics fetched from platform APIs.
  postAnalytics: defineTable({
    postId: v.id("posts"),
    platformPostId: v.string(),
    platform: v.union(
      v.literal("instagram"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("linkedin"),
    ),
    impressions: v.number(),
    reach: v.number(),
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    saves: v.number(),
    clicks: v.number(),
    fetchedAt: v.number(),
    periodStart: v.number(),
  })
    .index("by_postId", ["postId"])
    .index("by_periodStart", ["periodStart"])
    .index("by_postId_platform", ["postId", "platform"]),

  // ─── Account Analytics ───────────────────────────────────────────────────────
  // Daily account-level metrics for trend tracking.
  accountAnalytics: defineTable({
    socialAccountId: v.id("socialAccounts"),
    date: v.number(),
    followers: v.number(),
    following: v.number(),
    engagementRate: v.number(),
    postsCount: v.number(),
    fetchedAt: v.number(),
  })
    .index("by_socialAccountId", ["socialAccountId"])
    .index("by_date", ["date"])
    .index("by_socialAccountId_date", ["socialAccountId", "date"]),

  // ─── Approval Events ────────────────────────────────────────────────────────
  // Tracks the full approval lifecycle for posts requiring review.
  approvalEvents: defineTable({
    postId: v.id("posts"),
    orgId: v.optional(v.id("organizations")),
    actorId: v.id("users"),
    action: v.union(
      v.literal("submitted"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("changes_requested"),
    ),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_postId", ["postId"])
    .index("by_orgId", ["orgId"])
    .index("by_actorId", ["actorId"]),

  // ─── AI Usage Log ────────────────────────────────────────────────────────────
  // Tracks LLM API usage for credit metering and billing.
  aiUsageLog: defineTable({
    userId: v.id("users"),
    orgId: v.optional(v.id("organizations")),
    action: v.union(
      v.literal("generate"),
      v.literal("rewrite"),
      v.literal("hashtags"),
    ),
    provider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("anthropic"),
    ),
    inputTokens: v.number(),
    outputTokens: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  // ─── Notifications ─────────────────────────────────────────────────────────
  // In-app notification records for users.
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("post_published"),
      v.literal("post_failed"),
      v.literal("approval_requested"),
      v.literal("post_approved"),
      v.literal("post_rejected"),
      v.literal("subscription_changed"),
      v.literal("credits_low"),
      v.literal("account_disconnected"),
    ),
    message: v.string(),
    metadata: v.optional(v.string()), // JSON-encoded metadata for flexibility
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  // ─── Rate Limit Counters ───────────────────────────────────────────────────
  // Sliding-window rate limit tracking backed by Convex documents.
  rateLimitCounters: defineTable({
    key: v.string(), // e.g., "publishing:user_123" or "ai:user_456"
    count: v.number(),
    windowStart: v.number(), // Timestamp (ms) when the current window began
    windowMs: v.number(), // Duration of the window in ms
  })
    .index("by_key", ["key"]),
});
