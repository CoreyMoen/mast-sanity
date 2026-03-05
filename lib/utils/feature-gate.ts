/**
 * feature-gate.ts — Client-side feature gate utilities.
 *
 * Provides boolean checks for tier-based feature access and usage limits.
 * All functions use TIER_LIMITS from validation.ts as the source of truth.
 */

import { TIER_LIMITS, type SubscriptionTier } from "./validation";

// ─── Usage-based gates ───────────────────────────────────────────────────────

/** Check if the user can create another post this month. */
export function canCreatePost(
  tier: SubscriptionTier,
  currentPostCount: number,
): boolean {
  const max = TIER_LIMITS[tier].scheduledPostsPerMonth;
  return max === Infinity || currentPostCount < max;
}

/** Check if the user can connect another social account. */
export function canConnectAccount(
  tier: SubscriptionTier,
  currentAccountCount: number,
): boolean {
  return currentAccountCount < TIER_LIMITS[tier].connectedAccounts;
}

/** Check if the user can invite another team member. */
export function canInviteTeamMember(
  tier: SubscriptionTier,
  currentMemberCount: number,
): boolean {
  return currentMemberCount < TIER_LIMITS[tier].teamMembers;
}

/** Check if the user can use an AI credit. */
export function canUseAI(
  tier: SubscriptionTier,
  currentCreditsUsed: number,
): boolean {
  const max = TIER_LIMITS[tier].aiCreditsPerMonth;
  return max === Infinity || currentCreditsUsed < max;
}

// ─── Boolean feature gates ───────────────────────────────────────────────────

/** Check if the user's tier includes analytics. */
export function canViewAnalytics(tier: SubscriptionTier): boolean {
  // All tiers have analytics — the difference is retention days.
  // Only free tier has 7-day retention; pro/business have 90/365 days.
  return TIER_LIMITS[tier].analyticsRetentionDays > 7;
}

/** Check if the user's tier supports recurring posts. */
export function canUseRecurring(tier: SubscriptionTier): boolean {
  return TIER_LIMITS[tier].recurringPosts;
}

/** Check if the user's tier supports approval workflows. */
export function canUseApprovalWorkflow(tier: SubscriptionTier): boolean {
  return TIER_LIMITS[tier].approvalWorkflows;
}

// ─── Feature metadata ────────────────────────────────────────────────────────

export type GatedFeature =
  | "analytics"
  | "recurringPosts"
  | "approvalWorkflows"
  | "prioritySupport"
  | "customBranding";

const FEATURE_META: Record<
  GatedFeature,
  { label: string; requiredTier: SubscriptionTier; description: string }
> = {
  analytics: {
    label: "Advanced Analytics",
    requiredTier: "pro",
    description:
      "Unlock up to 90 days of analytics retention with detailed engagement metrics.",
  },
  recurringPosts: {
    label: "Recurring Posts",
    requiredTier: "pro",
    description:
      "Set up automated recurring posts on a daily, weekly, or custom schedule.",
  },
  approvalWorkflows: {
    label: "Approval Workflows",
    requiredTier: "pro",
    description:
      "Route posts through an approval flow before publishing to ensure quality.",
  },
  prioritySupport: {
    label: "Priority Support",
    requiredTier: "business",
    description:
      "Get faster response times and dedicated support from our team.",
  },
  customBranding: {
    label: "Custom Branding",
    requiredTier: "business",
    description:
      "Remove Angela branding and customize reports with your own logo.",
  },
};

/** Get a human-readable upgrade CTA message for a gated feature. */
export function getUpgradeMessage(feature: GatedFeature): string {
  const meta = FEATURE_META[feature];
  const tierLabel = meta.requiredTier === "pro" ? "Pro" : "Business";
  return `Upgrade to ${tierLabel} to unlock ${meta.label}.`;
}

/** Get full metadata for a gated feature. */
export function getFeatureMeta(feature: GatedFeature) {
  return FEATURE_META[feature];
}

/** Check if a boolean feature is available for a given tier. */
export function isFeatureAvailable(
  feature: GatedFeature,
  tier: SubscriptionTier,
): boolean {
  const tierOrder: SubscriptionTier[] = ["free", "pro", "business"];
  const meta = FEATURE_META[feature];
  return tierOrder.indexOf(tier) >= tierOrder.indexOf(meta.requiredTier);
}
