/**
 * crons.ts — Cron job definitions.
 *
 * Defines scheduled tasks that run at regular intervals:
 * - Check for due posts every minute and publish them
 * - Fetch analytics from platform APIs periodically
 * - Generate posts from recurring rules
 * - Refresh expiring OAuth tokens proactively
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ─── Post Publishing ────────────────────────────────────────────────────────
// Every minute, check for posts whose scheduledAt has passed and publish them.
crons.interval(
  "publish-due-posts",
  { minutes: 1 },
  internal.publishingActions.checkAndPublishDuePosts,
);

// ─── Recurring Post Generation ──────────────────────────────────────────────
// Every 15 minutes, process recurring rules and generate new scheduled posts.
crons.interval(
  "process-recurring-rules",
  { minutes: 15 },
  internal.recurringPosts.processRecurringRules,
);

// ─── Analytics Fetching ─────────────────────────────────────────────────────
// Every 6 hours, fetch updated analytics from platform APIs.
// Iterates over all active social accounts and recently published posts.
crons.interval(
  "fetch-analytics",
  { hours: 6 },
  internal.analyticsActions.fetchAllAnalytics,
);

// ─── Token Refresh ─────────────────────────────────────────────────────────
// Every 6 hours, check for social account tokens expiring within 24 hours
// and proactively refresh them so publishing and analytics never fail
// due to stale tokens.
crons.interval(
  "refresh-expiring-tokens",
  { hours: 6 },
  internal.socialAccountActions.checkAndRefreshExpiringTokens,
);

// ─── Data Retention Enforcement ─────────────────────────────────────────────
// Once per day, delete analytics and AI usage logs that exceed each user's
// tier-based retention window (free: 7d, pro: 90d, business: 365d).
crons.interval(
  "enforce-data-retention",
  { hours: 24 },
  internal.dataRetention.enforceRetention,
);

export default crons;
