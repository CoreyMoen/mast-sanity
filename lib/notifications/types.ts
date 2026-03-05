/**
 * types.ts — Notification type definitions.
 *
 * Shared types for the notification system covering both
 * email and in-app notification channels.
 */

/** All notification event types in Angela. */
export type NotificationType =
  | "post_published"
  | "post_failed"
  | "approval_requested"
  | "post_approved"
  | "post_rejected"
  | "subscription_changed"
  | "credits_low"
  | "account_disconnected";

/** Delivery channel for a notification. */
export type NotificationChannel = "email" | "in_app";

/** Metadata payload included with each notification type. */
export type NotificationMetadata =
  | { type: "post_published"; postTitle: string; platforms: string[] }
  | { type: "post_failed"; postTitle: string; error: string }
  | { type: "approval_requested"; postTitle: string; submitterName: string }
  | { type: "post_approved"; postTitle: string; approverName: string }
  | { type: "post_rejected"; postTitle: string; reviewerName: string; reason: string }
  | { type: "subscription_changed"; oldTier: string; newTier: string }
  | { type: "credits_low"; creditsUsed: number; creditsLimit: number }
  | { type: "account_disconnected"; platform: string; accountName: string };

/** Full notification payload used to create a notification record. */
export interface NotificationPayload {
  type: NotificationType;
  userId: string;
  channel: NotificationChannel;
  metadata: NotificationMetadata;
}

/** Human-readable labels for notification types. */
export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  post_published: "Post Published",
  post_failed: "Post Failed",
  approval_requested: "Approval Requested",
  post_approved: "Post Approved",
  post_rejected: "Post Rejected",
  subscription_changed: "Subscription Changed",
  credits_low: "Credits Running Low",
  account_disconnected: "Account Disconnected",
};

/**
 * Build a human-readable message string from notification metadata.
 * Used for both in-app display and email subject generation.
 */
export function buildNotificationMessage(metadata: NotificationMetadata): string {
  switch (metadata.type) {
    case "post_published":
      return `"${metadata.postTitle}" was published to ${metadata.platforms.join(", ")}`;
    case "post_failed":
      return `"${metadata.postTitle}" failed to publish: ${metadata.error}`;
    case "approval_requested":
      return `${metadata.submitterName} submitted "${metadata.postTitle}" for approval`;
    case "post_approved":
      return `"${metadata.postTitle}" was approved by ${metadata.approverName}`;
    case "post_rejected":
      return `"${metadata.postTitle}" was rejected by ${metadata.reviewerName}`;
    case "subscription_changed":
      return `Your plan changed from ${metadata.oldTier} to ${metadata.newTier}`;
    case "credits_low":
      return `You've used ${metadata.creditsUsed} of ${metadata.creditsLimit} AI credits`;
    case "account_disconnected":
      return `Your ${metadata.platform} account "${metadata.accountName}" was disconnected`;
  }
}
