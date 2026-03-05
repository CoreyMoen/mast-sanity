/**
 * email.ts — Email notification sender.
 *
 * Provides functions to send transactional email notifications
 * using a simple fetch-based approach. Stubbed for Resend/SendGrid
 * integration — set EMAIL_API_KEY and EMAIL_API_URL env vars to enable.
 *
 * Each notification type has a dedicated template builder that returns
 * branded HTML for the email body.
 */

// ─── Configuration ──────────────────────────────────────────────────────────

const EMAIL_API_URL =
  process.env.EMAIL_API_URL ?? "https://api.resend.com/emails";
const EMAIL_API_KEY = process.env.EMAIL_API_KEY ?? "";
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Angela <notifications@angela.app>";

// ─── Core sender ────────────────────────────────────────────────────────────

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a transactional email via the configured email API.
 * Returns a result object instead of throwing so callers can
 * decide how to handle failures (log, retry, etc.).
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  htmlBody: string,
): Promise<SendEmailResult> {
  if (!EMAIL_API_KEY) {
    console.warn(
      "[email] EMAIL_API_KEY is not configured — skipping email send.",
    );
    return { success: false, error: "EMAIL_API_KEY not configured" };
  }

  try {
    const response = await fetch(EMAIL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[email] Send failed (${response.status}): ${body}`);
      return {
        success: false,
        error: `HTTP ${response.status}: ${body}`,
      };
    }

    const data = await response.json();
    return { success: true, messageId: data.id ?? data.messageId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email error";
    console.error(`[email] Send error: ${message}`);
    return { success: false, error: message };
  }
}

// ─── HTML layout wrapper ────────────────────────────────────────────────────

/**
 * Wraps email content in a branded Angela layout with indigo accent.
 */
function wrapInLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #4f46e5; padding: 24px 32px;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.025em;">Angela</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                You're receiving this because you have notifications enabled in Angela.
                <br />
                <a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL ?? "https://angela.app")}/dashboard/settings" style="color: #6366f1; text-decoration: none;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Template builders ──────────────────────────────────────────────────────

/**
 * Build email HTML for a successfully published post.
 */
export function buildPostPublishedEmail(
  postTitle: string,
  platforms: string[],
): { subject: string; html: string } {
  const platformList = platforms
    .map(
      (p) =>
        `<span style="display: inline-block; background-color: #eef2ff; color: #4f46e5; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 9999px; margin: 2px 4px 2px 0;">${escapeHtml(p)}</span>`,
    )
    .join(" ");

  const body = `
    <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;">Post Published</h2>
    <p style="margin: 0 0 20px; font-size: 14px; color: #6b7280; line-height: 1.6;">
      Your post has been successfully published to all selected platforms.
    </p>
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;">Post Title</p>
      <p style="margin: 0 0 12px; font-size: 14px; color: #111827;">${escapeHtml(postTitle)}</p>
      <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #374151;">Platforms</p>
      <div>${platformList}</div>
    </div>
    <a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL ?? "https://angela.app")}/dashboard/posts" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 8px;">View Posts</a>
  `;

  return {
    subject: `Published: ${postTitle}`,
    html: wrapInLayout("Post Published", body),
  };
}

/**
 * Build email HTML for a failed post publish attempt.
 */
export function buildPostFailedEmail(
  postTitle: string,
  error: string,
): { subject: string; html: string } {
  const body = `
    <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;">Post Failed to Publish</h2>
    <p style="margin: 0 0 20px; font-size: 14px; color: #6b7280; line-height: 1.6;">
      Something went wrong while publishing your post. You can retry from your dashboard.
    </p>
    <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
      <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;">Post Title</p>
      <p style="margin: 0 0 12px; font-size: 14px; color: #111827;">${escapeHtml(postTitle)}</p>
      <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #991b1b;">Error</p>
      <p style="margin: 0; font-size: 13px; color: #7f1d1d; font-family: monospace;">${escapeHtml(error)}</p>
    </div>
    <a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL ?? "https://angela.app")}/dashboard/posts" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 8px;">View Posts</a>
  `;

  return {
    subject: `Failed: ${postTitle}`,
    html: wrapInLayout("Post Failed", body),
  };
}

/**
 * Build email HTML for an approval request notification.
 */
export function buildApprovalRequestedEmail(
  postTitle: string,
  submitterName: string,
): { subject: string; html: string } {
  const body = `
    <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;">Approval Requested</h2>
    <p style="margin: 0 0 20px; font-size: 14px; color: #6b7280; line-height: 1.6;">
      <strong style="color: #111827;">${escapeHtml(submitterName)}</strong> submitted a post for your review.
    </p>
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;">Post Title</p>
      <p style="margin: 0; font-size: 14px; color: #111827;">${escapeHtml(postTitle)}</p>
    </div>
    <a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL ?? "https://angela.app")}/dashboard/approvals" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 8px;">Review Post</a>
  `;

  return {
    subject: `Approval needed: ${postTitle}`,
    html: wrapInLayout("Approval Requested", body),
  };
}

/**
 * Build email HTML for a post approval notification.
 */
export function buildPostApprovedEmail(
  postTitle: string,
  approverName: string,
): { subject: string; html: string } {
  const body = `
    <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;">Post Approved</h2>
    <p style="margin: 0 0 20px; font-size: 14px; color: #6b7280; line-height: 1.6;">
      <strong style="color: #111827;">${escapeHtml(approverName)}</strong> approved your post.
    </p>
    <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #22c55e;">
      <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;">Post Title</p>
      <p style="margin: 0; font-size: 14px; color: #111827;">${escapeHtml(postTitle)}</p>
    </div>
    <a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL ?? "https://angela.app")}/dashboard/posts" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 8px;">View Post</a>
  `;

  return {
    subject: `Approved: ${postTitle}`,
    html: wrapInLayout("Post Approved", body),
  };
}

/**
 * Build email HTML for a low credits warning.
 */
export function buildCreditsLowEmail(
  creditsUsed: number,
  creditsLimit: number,
): { subject: string; html: string } {
  const percentage = Math.round((creditsUsed / creditsLimit) * 100);
  const remaining = creditsLimit - creditsUsed;

  const body = `
    <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;">AI Credits Running Low</h2>
    <p style="margin: 0 0 20px; font-size: 14px; color: #6b7280; line-height: 1.6;">
      You've used ${percentage}% of your monthly AI credits. Consider upgrading your plan to avoid running out.
    </p>
    <div style="background-color: #fffbeb; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;">Usage</p>
      <p style="margin: 0 0 4px; font-size: 14px; color: #111827;">${creditsUsed} of ${creditsLimit} credits used</p>
      <p style="margin: 0; font-size: 13px; color: #92400e;">${remaining} credits remaining</p>
      <!-- Progress bar -->
      <div style="margin-top: 12px; background-color: #fef3c7; border-radius: 9999px; height: 8px; overflow: hidden;">
        <div style="background-color: ${percentage >= 90 ? "#ef4444" : "#f59e0b"}; height: 100%; width: ${percentage}%; border-radius: 9999px;"></div>
      </div>
    </div>
    <a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL ?? "https://angela.app")}/dashboard/settings" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 8px;">Upgrade Plan</a>
  `;

  return {
    subject: `AI credits running low (${percentage}% used)`,
    html: wrapInLayout("Credits Low", body),
  };
}
