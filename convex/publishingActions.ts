"use node";

/**
 * publishingActions.ts — Platform API publishing actions.
 *
 * Handles the actual publishing of posts to social media platforms
 * (Instagram, Facebook, Twitter/X, LinkedIn) via their respective APIs.
 * Uses Convex actions for external HTTP calls.
 *
 * Queries and mutations that these actions depend on live in publishing.ts.
 *
 * Media resolution flow:
 *   1. Post has `mediaIds` — string references to records in the `media` table.
 *   2. The internal query `getMediaForPublishing` resolves each ID to its
 *      Convex storage URL, MIME type, filename, and file size.
 *   3. For URL-based platforms (Instagram, Facebook, LinkedIn), the storage URLs
 *      are passed directly in the payload's `mediaUrls`.
 *   4. For binary-upload platforms (Twitter), the file bytes are fetched from
 *      the storage URL, uploaded via the client's `uploadMedia()` method, and
 *      the resulting platform-specific media IDs are passed in `mediaUrls`.
 */

import { v, ConvexError } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { instagramClient } from "../lib/platforms/instagram";
import { facebookClient } from "../lib/platforms/facebook";
import { twitterClient } from "../lib/platforms/twitter";
import { linkedinClient } from "../lib/platforms/linkedin";
import type { SocialPlatformClient, MediaUploadInput } from "../lib/platforms/types";

// ─── Platform client registry ────────────────────────────────────────────────

const platformClients: Record<string, SocialPlatformClient> = {
  instagram: instagramClient,
  facebook: facebookClient,
  twitter: twitterClient,
  linkedin: linkedinClient,
};

// ─── Media resolution helpers ────────────────────────────────────────────────

/** Shape of a resolved media item returned by getMediaForPublishing. */
interface ResolvedMedia {
  mediaId: string;
  storageUrl: string;
  mimeType: string;
  filename: string;
  fileSize: number;
}

/**
 * Download a file from a URL and return the bytes as an ArrayBuffer.
 * Used to fetch files from Convex storage URLs for platforms that
 * require binary upload (e.g., Twitter).
 */
async function downloadFile(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download media from storage (${response.status}): ${response.statusText}`,
    );
  }
  return await response.arrayBuffer();
}

/**
 * Resolve media for a specific platform:
 *
 * - **Twitter**: Downloads each file, uploads via `client.uploadMedia()`,
 *   and returns an array of platform-specific media ID strings.
 * - **Other platforms** (Instagram, Facebook, LinkedIn): Returns the
 *   Convex storage URLs directly, since those APIs accept public URLs.
 *
 * Returns an array of strings to be set on `payload.mediaUrls`.
 */
async function resolveMediaForPlatform(
  client: SocialPlatformClient,
  platform: string,
  accessToken: string,
  resolvedMedia: ResolvedMedia[],
): Promise<{ mediaUrls: string[]; errors: string[] }> {
  const mediaUrls: string[] = [];
  const errors: string[] = [];

  if (resolvedMedia.length === 0) {
    return { mediaUrls, errors };
  }

  // If the client has an uploadMedia method, we need to download files
  // and upload them via the platform's binary upload API.
  if (client.uploadMedia) {
    for (const media of resolvedMedia) {
      try {
        const fileData = await downloadFile(media.storageUrl);

        const uploadInput: MediaUploadInput = {
          data: fileData,
          mimeType: media.mimeType,
          filename: media.filename,
          fileSize: media.fileSize,
        };

        const uploadResult = await client.uploadMedia(accessToken, uploadInput);

        if (uploadResult.success && uploadResult.mediaId) {
          mediaUrls.push(uploadResult.mediaId);
        } else {
          errors.push(
            `Failed to upload ${media.filename} to ${platform}: ${uploadResult.error ?? "Unknown error"}`,
          );
        }
      } catch (err) {
        errors.push(
          `Failed to upload ${media.filename} to ${platform}: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    }
  } else {
    // URL-based platforms: pass the Convex storage URLs directly
    for (const media of resolvedMedia) {
      mediaUrls.push(media.storageUrl);
    }
  }

  return { mediaUrls, errors };
}

// ─── Publish a post to all targeted platforms ────────────────────────────────

/**
 * Publish a post to all targeted platforms.
 * Called by the cron scheduler when a post's scheduledAt time arrives,
 * or directly for "publish now" flows.
 */
export const publishPost = action({
  args: { postId: v.id("posts") },
  handler: async (ctx: any, args: any) => {
    // 0. Auth check: verify the caller is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Not authenticated" });

    // Rate limit check
    const rateLimit = await ctx.runMutation(internal.rateLimits.checkAndIncrement, {
      key: `publishing:${identity.subject}`,
      category: "publishing",
    });
    if (!rateLimit.allowed) {
      throw new ConvexError({ code: "RATE_LIMITED", message: "Too many publish requests. Please try again shortly." });
    }

    // 1. Fetch the post
    const post = await ctx.runQuery(internal.publishing.getPostForPublishing, {
      postId: args.postId,
    });
    if (!post) throw new ConvexError({ code: "NOT_FOUND", message: "Post not found" });

    // 1.5. Verify ownership: the authenticated user must be the post author
    const author = await ctx.runQuery(internal.users.getById, { userId: post.authorId });
    if (!author || author.clerkId !== identity.subject) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Not authorized to publish this post" });
    }

    // 2. Guard: only draft/scheduled posts should be published
    if (
      post.status !== "draft" &&
      post.status !== "scheduled" &&
      post.status !== "failed" &&
      post.status !== "partially_published"
    ) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: `Post cannot be published from status "${post.status}"`,
      });
    }

    // 3. Mark post as publishing
    await ctx.runMutation(internal.publishing.updatePostStatus, {
      postId: args.postId,
      status: "publishing",
    });

    // 4. Resolve media assets from Convex storage
    const resolvedMedia: ResolvedMedia[] = [];
    if (post.mediaIds && post.mediaIds.length > 0) {
      const mediaItems = await ctx.runQuery(
        internal.publishing.getMediaForPublishing,
        { mediaIds: post.mediaIds },
      );
      for (const item of mediaItems) {
        if (item) {
          resolvedMedia.push(item);
        }
      }
    }

    // 5. Fetch social accounts for the author's selected platforms
    const socialAccounts = await ctx.runQuery(
      internal.publishing.getSocialAccountsForPost,
      {
        authorId: post.authorId,
        platforms: post.platforms,
      },
    );

    if (socialAccounts.length === 0) {
      await ctx.runMutation(internal.publishing.updatePostStatus, {
        postId: args.postId,
        status: "failed",
        failureReason: "No connected social accounts found for selected platforms.",
      });
      return {
        success: false,
        error: "No connected social accounts found for selected platforms.",
        results: [],
      };
    }

    // 6. Create platformPost records for each social account (pending status)
    const platformPostIds = await ctx.runMutation(
      internal.publishing.createPlatformPosts,
      {
        postId: args.postId,
        socialAccounts: socialAccounts.map((sa: any) => ({
          socialAccountId: sa._id,
          platform: sa.platform,
        })),
      },
    );

    // 7. Publish to each platform
    const results: Array<{
      platform: string;
      socialAccountId: string;
      platformPostRecordId: string;
      success: boolean;
      platformPostId?: string;
      error?: string;
    }> = [];

    for (let i = 0; i < socialAccounts.length; i++) {
      const account = socialAccounts[i];
      const platformPostRecordId = platformPostIds[i];
      const client = platformClients[account.platform];

      if (!client) {
        // Unknown platform - mark as failed
        await ctx.runMutation(internal.publishing.updatePlatformPostStatus, {
          platformPostId: platformPostRecordId as Id<"platformPosts">,
          status: "failed",
          failureReason: `Unknown platform: ${account.platform}`,
        });
        results.push({
          platform: account.platform,
          socialAccountId: account._id,
          platformPostRecordId,
          success: false,
          error: `Unknown platform: ${account.platform}`,
        });
        continue;
      }

      try {
        // Ensure the token is valid, refreshing if expired or about to expire.
        // This returns a decrypted, ready-to-use access token.
        const accessToken = await ctx.runAction(
          internal.socialAccountActions.ensureValidToken,
          { accountId: account._id },
        );

        // Resolve media for this specific platform (binary upload vs URL)
        const { mediaUrls, errors: mediaErrors } =
          await resolveMediaForPlatform(
            client,
            account.platform,
            accessToken,
            resolvedMedia,
          );

        // If all media uploads failed and the post has required media, fail this platform
        if (
          resolvedMedia.length > 0 &&
          mediaUrls.length === 0 &&
          mediaErrors.length > 0
        ) {
          const errorMsg = `Media upload failed: ${mediaErrors.join("; ")}`;
          await ctx.runMutation(internal.publishing.updatePlatformPostStatus, {
            platformPostId: platformPostRecordId as Id<"platformPosts">,
            status: "failed",
            failureReason: errorMsg,
          });
          results.push({
            platform: account.platform,
            socialAccountId: account._id,
            platformPostRecordId,
            success: false,
            error: errorMsg,
          });
          continue;
        }

        // Log partial media failures as warnings but proceed with what we have
        if (mediaErrors.length > 0) {
          console.warn(
            `Partial media upload failures for ${account.platform}:`,
            mediaErrors,
          );
        }

        // Build the payload with resolved media URLs or platform media IDs
        const payload = {
          content: post.content,
          mediaUrls,
          hashtags: post.hashtags,
        };

        // Call the platform API
        const result = await client.publish(
          accessToken,
          account.platformAccountId,
          payload,
        );

        // Update the platformPost record
        await ctx.runMutation(internal.publishing.updatePlatformPostStatus, {
          platformPostId: platformPostRecordId as Id<"platformPosts">,
          status: result.success ? "published" : "failed",
          externalPostId: result.platformPostId,
          failureReason: result.error,
        });

        results.push({
          platform: account.platform,
          socialAccountId: account._id,
          platformPostRecordId,
          success: result.success,
          platformPostId: result.platformPostId,
          error: result.error,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown publishing error";

        await ctx.runMutation(internal.publishing.updatePlatformPostStatus, {
          platformPostId: platformPostRecordId as Id<"platformPosts">,
          status: "failed",
          failureReason: errorMessage,
        });

        results.push({
          platform: account.platform,
          socialAccountId: account._id,
          platformPostRecordId,
          success: false,
          error: errorMessage,
        });
      }
    }

    // 8. Determine overall post status
    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;

    let finalStatus: "published" | "partially_published" | "failed";
    let failureReason: string | undefined;

    if (successCount === totalCount) {
      finalStatus = "published";
    } else if (successCount === 0) {
      finalStatus = "failed";
      failureReason = results
        .map((r) => `${r.platform}: ${r.error}`)
        .join("; ");
    } else {
      finalStatus = "partially_published";
      const failedPlatforms = results
        .filter((r) => !r.success)
        .map((r) => `${r.platform}: ${r.error}`)
        .join("; ");
      failureReason = `Partial failure: ${failedPlatforms}`;
    }

    await ctx.runMutation(internal.publishing.updatePostStatus, {
      postId: args.postId,
      status: finalStatus,
      failureReason,
    });

    // 9. Send notification to the post author
    if (finalStatus === "published") {
      await ctx.runMutation(internal.notifications.create, {
        userId: post.authorId,
        type: "post_published",
        message: `Your post was published to ${results.map((r) => r.platform).join(", ")}.`,
        metadata: JSON.stringify({ postId: args.postId }),
      });
    } else if (finalStatus === "failed" || finalStatus === "partially_published") {
      const failedPlatforms = results
        .filter((r) => !r.success)
        .map((r) => r.platform);
      await ctx.runMutation(internal.notifications.create, {
        userId: post.authorId,
        type: "post_failed",
        message:
          finalStatus === "failed"
            ? `Your post failed to publish to ${failedPlatforms.join(", ")}.`
            : `Your post partially published. Failed on: ${failedPlatforms.join(", ")}.`,
        metadata: JSON.stringify({
          postId: args.postId,
          failureReason,
        }),
      });
    }

    // 10. Send email notification (best effort)
    try {
      const author = await ctx.runQuery(internal.users.getById, { userId: post.authorId });
      if (author?.email) {
        const postTitle = post.content.slice(0, 60) + (post.content.length > 60 ? "..." : "");
        if (finalStatus === "published") {
          await ctx.runAction(internal.emailActions.sendPostPublishedEmail, {
            toEmail: author.email,
            postTitle,
            platforms: results.map((r: any) => r.platform),
          });
        } else if (finalStatus === "failed" || finalStatus === "partially_published") {
          await ctx.runAction(internal.emailActions.sendPostFailedEmail, {
            toEmail: author.email,
            postTitle,
            error: failureReason ?? "Unknown error",
          });
        }
      }
    } catch (emailErr) {
      console.warn("[publishing] Email notification failed (non-fatal):", emailErr);
    }

    return { success: successCount > 0, results };
  },
});

// ─── Check and publish due posts (called by cron) ────────────────────────────

/**
 * Internal action called by the cron job every minute.
 * Queries for posts with status "scheduled" and scheduledAt <= now,
 * then publishes each one.
 */
export const checkAndPublishDuePosts = internalAction({
  args: {},
  handler: async (ctx: any) => {
    const now = Date.now();

    // Fetch all posts that are due for publishing
    const duePosts = await ctx.runQuery(
      internal.publishing.getDueScheduledPosts,
      { now },
    );

    if (duePosts.length === 0) return;

    // Publish each due post independently — errors in one must not block others
    const results = [];
    for (const post of duePosts) {
      try {
        const result = await ctx.runAction(internal.publishingActions.publishPostInternal, {
          postId: post._id,
        });
        results.push({ postId: post._id, ...result });
      } catch (error) {
        // Mark the post as failed so it doesn't get retried indefinitely
        try {
          await ctx.runMutation(internal.publishing.updatePostStatus, {
            postId: post._id,
            status: "failed",
            failureReason:
              error instanceof Error
                ? error.message
                : "Unknown error during scheduled publishing",
          });
        } catch {
          // Last-resort: if even the status update fails, log and move on
          console.error(
            `Failed to update status for post ${post._id}:`,
            error,
          );
        }
        results.push({
          postId: post._id,
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});

/**
 * Internal version of publishPost that can be called from other Convex actions.
 * Same logic as the public publishPost, but exposed as an internalAction.
 */
export const publishPostInternal = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx: any, args: any) => {
    // 1. Fetch the post
    const post = await ctx.runQuery(internal.publishing.getPostForPublishing, {
      postId: args.postId,
    });
    if (!post) throw new ConvexError({ code: "NOT_FOUND", message: "Post not found" });

    // 2. Guard: only scheduled posts should be processed by the cron
    if (
      post.status !== "draft" &&
      post.status !== "scheduled" &&
      post.status !== "failed" &&
      post.status !== "partially_published"
    ) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: `Post cannot be published from status "${post.status}"`,
      });
    }

    // 3. Mark post as publishing
    await ctx.runMutation(internal.publishing.updatePostStatus, {
      postId: args.postId,
      status: "publishing",
    });

    // 4. Resolve media assets from Convex storage
    const resolvedMedia: ResolvedMedia[] = [];
    if (post.mediaIds && post.mediaIds.length > 0) {
      const mediaItems = await ctx.runQuery(
        internal.publishing.getMediaForPublishing,
        { mediaIds: post.mediaIds },
      );
      for (const item of mediaItems) {
        if (item) {
          resolvedMedia.push(item);
        }
      }
    }

    // 5. Fetch social accounts
    const socialAccounts = await ctx.runQuery(
      internal.publishing.getSocialAccountsForPost,
      {
        authorId: post.authorId,
        platforms: post.platforms,
      },
    );

    if (socialAccounts.length === 0) {
      await ctx.runMutation(internal.publishing.updatePostStatus, {
        postId: args.postId,
        status: "failed",
        failureReason: "No connected social accounts found for selected platforms.",
      });
      return { success: false, error: "No connected social accounts." };
    }

    // 6. Create platformPost records
    const platformPostIds = await ctx.runMutation(
      internal.publishing.createPlatformPosts,
      {
        postId: args.postId,
        socialAccounts: socialAccounts.map((sa: any) => ({
          socialAccountId: sa._id,
          platform: sa.platform,
        })),
      },
    );

    // 7. Publish to each platform
    const results: Array<{
      platform: string;
      success: boolean;
      error?: string;
    }> = [];

    for (let i = 0; i < socialAccounts.length; i++) {
      const account = socialAccounts[i];
      const platformPostRecordId = platformPostIds[i];
      const client = platformClients[account.platform];

      if (!client) {
        await ctx.runMutation(internal.publishing.updatePlatformPostStatus, {
          platformPostId: platformPostRecordId as Id<"platformPosts">,
          status: "failed",
          failureReason: `Unknown platform: ${account.platform}`,
        });
        results.push({
          platform: account.platform,
          success: false,
          error: `Unknown platform: ${account.platform}`,
        });
        continue;
      }

      try {
        // Ensure the token is valid, refreshing if expired or about to expire.
        // This returns a decrypted, ready-to-use access token.
        const accessToken = await ctx.runAction(
          internal.socialAccountActions.ensureValidToken,
          { accountId: account._id },
        );

        // Resolve media for this specific platform (binary upload vs URL)
        const { mediaUrls, errors: mediaErrors } =
          await resolveMediaForPlatform(
            client,
            account.platform,
            accessToken,
            resolvedMedia,
          );

        // If all media uploads failed and the post has required media, fail this platform
        if (
          resolvedMedia.length > 0 &&
          mediaUrls.length === 0 &&
          mediaErrors.length > 0
        ) {
          const errorMsg = `Media upload failed: ${mediaErrors.join("; ")}`;
          await ctx.runMutation(internal.publishing.updatePlatformPostStatus, {
            platformPostId: platformPostRecordId as Id<"platformPosts">,
            status: "failed",
            failureReason: errorMsg,
          });
          results.push({
            platform: account.platform,
            success: false,
            error: errorMsg,
          });
          continue;
        }

        if (mediaErrors.length > 0) {
          console.warn(
            `Partial media upload failures for ${account.platform}:`,
            mediaErrors,
          );
        }

        // Build the payload with resolved media URLs or platform media IDs
        const payload = {
          content: post.content,
          mediaUrls,
          hashtags: post.hashtags,
        };

        const result = await client.publish(
          accessToken,
          account.platformAccountId,
          payload,
        );

        await ctx.runMutation(internal.publishing.updatePlatformPostStatus, {
          platformPostId: platformPostRecordId as Id<"platformPosts">,
          status: result.success ? "published" : "failed",
          externalPostId: result.platformPostId,
          failureReason: result.error,
        });

        results.push({
          platform: account.platform,
          success: result.success,
          error: result.error,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown publishing error";

        await ctx.runMutation(internal.publishing.updatePlatformPostStatus, {
          platformPostId: platformPostRecordId as Id<"platformPosts">,
          status: "failed",
          failureReason: errorMessage,
        });

        results.push({
          platform: account.platform,
          success: false,
          error: errorMessage,
        });
      }
    }

    // 8. Determine overall post status
    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;

    let finalStatus: "published" | "partially_published" | "failed";
    let failureReason: string | undefined;

    if (successCount === totalCount) {
      finalStatus = "published";
    } else if (successCount === 0) {
      finalStatus = "failed";
      failureReason = results
        .map((r) => `${r.platform}: ${r.error}`)
        .join("; ");
    } else {
      finalStatus = "partially_published";
      failureReason = results
        .filter((r) => !r.success)
        .map((r) => `${r.platform}: ${r.error}`)
        .join("; ");
    }

    await ctx.runMutation(internal.publishing.updatePostStatus, {
      postId: args.postId,
      status: finalStatus,
      failureReason,
    });

    // 9. Send notification to the post author
    if (finalStatus === "published") {
      await ctx.runMutation(internal.notifications.create, {
        userId: post.authorId,
        type: "post_published",
        message: `Your post was published to ${results.map((r) => r.platform).join(", ")}.`,
        metadata: JSON.stringify({ postId: args.postId }),
      });
    } else if (finalStatus === "failed" || finalStatus === "partially_published") {
      const failedPlatforms = results
        .filter((r) => !r.success)
        .map((r) => r.platform);
      await ctx.runMutation(internal.notifications.create, {
        userId: post.authorId,
        type: "post_failed",
        message:
          finalStatus === "failed"
            ? `Your post failed to publish to ${failedPlatforms.join(", ")}.`
            : `Your post partially published. Failed on: ${failedPlatforms.join(", ")}.`,
        metadata: JSON.stringify({
          postId: args.postId,
          failureReason,
        }),
      });
    }

    // 10. Send email notification (best effort)
    try {
      const author = await ctx.runQuery(internal.users.getById, { userId: post.authorId });
      if (author?.email) {
        const postTitle = post.content.slice(0, 60) + (post.content.length > 60 ? "..." : "");
        if (finalStatus === "published") {
          await ctx.runAction(internal.emailActions.sendPostPublishedEmail, {
            toEmail: author.email,
            postTitle,
            platforms: results.map((r: any) => r.platform),
          });
        } else if (finalStatus === "failed" || finalStatus === "partially_published") {
          await ctx.runAction(internal.emailActions.sendPostFailedEmail, {
            toEmail: author.email,
            postTitle,
            error: failureReason ?? "Unknown error",
          });
        }
      }
    } catch (emailErr) {
      console.warn("[publishing] Email notification failed (non-fatal):", emailErr);
    }

    return { success: successCount > 0, results };
  },
});
