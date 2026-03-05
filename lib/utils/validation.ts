/** Platform-specific character limits */
export const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
};

/** Check if content exceeds a platform's character limit */
export function exceedsCharLimit(
  content: string,
  platform: string,
): boolean {
  const limit = PLATFORM_CHAR_LIMITS[platform];
  if (!limit) return false;
  return content.length > limit;
}

/** Get remaining characters for a platform */
export function remainingChars(
  content: string,
  platform: string,
): number | null {
  const limit = PLATFORM_CHAR_LIMITS[platform];
  if (!limit) return null;
  return limit - content.length;
}

/** Validate an email address */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Subscription tier limits */
export const TIER_LIMITS = {
  free: {
    connectedAccounts: 1,
    scheduledPostsPerMonth: 10,
    teamMembers: 1,
    aiCreditsPerMonth: 10,
    analyticsRetentionDays: 7,
    approvalWorkflows: false,
    recurringPosts: false,
    prioritySupport: false,
    customBranding: false,
  },
  pro: {
    connectedAccounts: 10,
    scheduledPostsPerMonth: Infinity,
    teamMembers: 3,
    aiCreditsPerMonth: 100,
    analyticsRetentionDays: 90,
    approvalWorkflows: true,
    recurringPosts: true,
    prioritySupport: false,
    customBranding: false,
  },
  business: {
    connectedAccounts: 25,
    scheduledPostsPerMonth: Infinity,
    teamMembers: 15,
    aiCreditsPerMonth: Infinity,
    analyticsRetentionDays: 365,
    approvalWorkflows: true,
    recurringPosts: true,
    prioritySupport: true,
    customBranding: true,
  },
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;
