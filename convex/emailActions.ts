"use node";

/**
 * emailActions.ts — Email notification Convex actions.
 *
 * Wraps the email sender utility as internal actions so they can be
 * scheduled from mutations (via ctx.scheduler.runAfter).
 */

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import {
  sendNotificationEmail,
  buildPostPublishedEmail,
  buildPostFailedEmail,
  buildApprovalRequestedEmail,
  buildPostApprovedEmail,
} from "../lib/notifications/email";

/**
 * Send email notification when a post is published.
 */
export const sendPostPublishedEmail = internalAction({
  args: {
    toEmail: v.string(),
    postTitle: v.string(),
    platforms: v.array(v.string()),
  },
  handler: async (_ctx: any, args: any) => {
    const { subject, html } = buildPostPublishedEmail(args.postTitle, args.platforms);
    const result = await sendNotificationEmail(args.toEmail, subject, html);
    if (!result.success) {
      console.warn(`[emailActions] sendPostPublishedEmail failed: ${result.error}`);
    }
  },
});

/**
 * Send email notification when a post fails to publish.
 */
export const sendPostFailedEmail = internalAction({
  args: {
    toEmail: v.string(),
    postTitle: v.string(),
    error: v.string(),
  },
  handler: async (_ctx: any, args: any) => {
    const { subject, html } = buildPostFailedEmail(args.postTitle, args.error);
    const result = await sendNotificationEmail(args.toEmail, subject, html);
    if (!result.success) {
      console.warn(`[emailActions] sendPostFailedEmail failed: ${result.error}`);
    }
  },
});

/**
 * Send email notification when a post is submitted for approval.
 */
export const sendApprovalRequestEmail = internalAction({
  args: {
    toEmail: v.string(),
    postTitle: v.string(),
    submitterName: v.string(),
  },
  handler: async (_ctx: any, args: any) => {
    const { subject, html } = buildApprovalRequestedEmail(args.postTitle, args.submitterName);
    const result = await sendNotificationEmail(args.toEmail, subject, html);
    if (!result.success) {
      console.warn(`[emailActions] sendApprovalRequestEmail failed: ${result.error}`);
    }
  },
});

/**
 * Send email notification when a post is approved.
 */
export const sendPostApprovedEmail = internalAction({
  args: {
    toEmail: v.string(),
    postTitle: v.string(),
    approverName: v.string(),
  },
  handler: async (_ctx: any, args: any) => {
    const { subject, html } = buildPostApprovedEmail(args.postTitle, args.approverName);
    const result = await sendNotificationEmail(args.toEmail, subject, html);
    if (!result.success) {
      console.warn(`[emailActions] sendPostApprovedEmail failed: ${result.error}`);
    }
  },
});
