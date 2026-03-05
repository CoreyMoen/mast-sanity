"use node";

/**
 * socialAccountActions.ts — OAuth token refresh actions.
 *
 * Contains all action and internalAction functions for social account
 * token management. These require Node.js runtime for crypto operations
 * (encrypt/decrypt) and platform API calls.
 *
 * Queries and mutations live in socialAccounts.ts (no "use node").
 */

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { instagramClient } from "../lib/platforms/instagram";
import { facebookClient } from "../lib/platforms/facebook";
import { twitterClient } from "../lib/platforms/twitter";
import { linkedinClient } from "../lib/platforms/linkedin";
import type { SocialPlatformClient } from "../lib/platforms/types";
import { decrypt, encrypt } from "../lib/utils/encryption";

// ─── Platform client registry ────────────────────────────────────────────────

const platformClients: Record<string, SocialPlatformClient> = {
  instagram: instagramClient,
  facebook: facebookClient,
  twitter: twitterClient,
  linkedin: linkedinClient,
};

// ─── Constants ───────────────────────────────────────────────────────────────

/** Refresh tokens that expire within this window (24 hours in ms). */
const TOKEN_REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;

// ─── Token Refresh Actions ──────────────────────────────────────────────────

/**
 * Refresh expired OAuth tokens for a social account.
 * Called by the token refresh cron or before publishing.
 *
 * Flow:
 *   1. Fetch the account record from the DB
 *   2. Decrypt the stored refresh token
 *   3. Call the platform-specific refresh endpoint
 *   4. Encrypt the new tokens
 *   5. Store the new tokens via updateTokens
 *
 * Returns { success, error? } so callers can handle failures gracefully.
 */
export const refreshToken = action({
  args: { accountId: v.id("socialAccounts") },
  handler: async (ctx: any, args: any): Promise<{ success: boolean; error?: string }> => {
    // Rate limit check
    const rateLimit = await ctx.runMutation(internal.rateLimits.checkAndIncrement, {
      key: `oauth:${args.accountId}`,
      category: "oauth",
    });
    if (!rateLimit.allowed) {
      return { success: false, error: "Rate limited. Please try again shortly." };
    }

    // 1. Fetch the account
    const account = await ctx.runQuery(
      internal.socialAccounts.getAccountForRefresh,
      { accountId: args.accountId },
    );

    if (!account) {
      return { success: false, error: "Account not found" };
    }

    if (!account.isActive) {
      return { success: false, error: "Account is deactivated" };
    }

    // 2. Determine which token to use for refresh
    // Instagram/Facebook use the access token itself for refresh (long-lived token exchange).
    // Twitter and LinkedIn use a separate refresh token.
    const tokenForRefresh = account.refreshToken ?? account.accessToken;
    if (!tokenForRefresh) {
      return { success: false, error: "No refresh token available" };
    }

    // 3. Decrypt the token
    const encryptionKey = process.env.ENCRYPTION_KEY;
    let decryptedToken = tokenForRefresh;
    if (encryptionKey) {
      try {
        decryptedToken = decrypt(tokenForRefresh, encryptionKey);
      } catch (e) {
        if (process.env.NODE_ENV === "production") {
          throw new Error("Token decryption failed in production — tokens must be encrypted");
        }
        // Token may be stored in plaintext during development
      }
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY is required in production");
    }

    // 4. Get the platform client and call the refresh endpoint
    const client = platformClients[account.platform];
    if (!client) {
      return { success: false, error: `Unknown platform: ${account.platform}` };
    }

    try {
      const result = await client.refreshToken(decryptedToken);

      // 5. Encrypt the new tokens before storing
      let encryptedAccessToken = result.accessToken;
      let encryptedRefreshToken = result.refreshToken;

      if (encryptionKey) {
        encryptedAccessToken = encrypt(result.accessToken, encryptionKey);
        if (result.refreshToken) {
          encryptedRefreshToken = encrypt(result.refreshToken, encryptionKey);
        }
      }

      // 6. Store the new tokens
      await ctx.runMutation(internal.socialAccounts.updateTokens, {
        accountId: args.accountId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: result.expiresAt,
      });

      console.log(
        `Successfully refreshed token for ${account.platform} account "${account.accountName}" (${args.accountId})`,
      );

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown token refresh error";

      console.error(
        `Failed to refresh token for ${account.platform} account "${account.accountName}" (${args.accountId}): ${errorMessage}`,
      );

      // Notify the account owner that their token refresh failed
      await ctx.runMutation(internal.notifications.create, {
        userId: account.userId,
        type: "account_disconnected",
        message: `Failed to refresh ${account.platform} token for "${account.accountName}". Please reconnect your account.`,
        metadata: JSON.stringify({
          accountId: args.accountId,
          platform: account.platform,
          error: errorMessage,
        }),
      });

      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Internal action to refresh a single account's token.
 * Called from the cron-driven checkAndRefreshExpiringTokens action.
 */
export const refreshTokenInternal = internalAction({
  args: { accountId: v.id("socialAccounts") },
  handler: async (ctx: any, args: any): Promise<{ success: boolean; error?: string }> => {
    // 1. Fetch the account
    const account = await ctx.runQuery(
      internal.socialAccounts.getAccountForRefresh,
      { accountId: args.accountId },
    );

    if (!account) {
      return { success: false, error: "Account not found" };
    }

    if (!account.isActive) {
      return { success: false, error: "Account is deactivated" };
    }

    // Determine which token to use for refresh
    const tokenForRefresh = account.refreshToken ?? account.accessToken;
    if (!tokenForRefresh) {
      return { success: false, error: "No refresh token available" };
    }

    // Decrypt the token
    const encryptionKey = process.env.ENCRYPTION_KEY;
    let decryptedToken = tokenForRefresh;
    if (encryptionKey) {
      try {
        decryptedToken = decrypt(tokenForRefresh, encryptionKey);
      } catch (e) {
        if (process.env.NODE_ENV === "production") {
          throw new Error("Token decryption failed in production — tokens must be encrypted");
        }
        // Token may be stored in plaintext during development
      }
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY is required in production");
    }

    // Get the platform client and call the refresh endpoint
    const client = platformClients[account.platform];
    if (!client) {
      return { success: false, error: `Unknown platform: ${account.platform}` };
    }

    try {
      const result = await client.refreshToken(decryptedToken);

      // Encrypt the new tokens before storing
      let encryptedAccessToken = result.accessToken;
      let encryptedRefreshToken = result.refreshToken;

      if (encryptionKey) {
        encryptedAccessToken = encrypt(result.accessToken, encryptionKey);
        if (result.refreshToken) {
          encryptedRefreshToken = encrypt(result.refreshToken, encryptionKey);
        }
      }

      // Store the new tokens
      await ctx.runMutation(internal.socialAccounts.updateTokens, {
        accountId: args.accountId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: result.expiresAt,
      });

      console.log(
        `[cron] Refreshed token for ${account.platform} account "${account.accountName}" (${args.accountId})`,
      );

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown token refresh error";

      console.error(
        `[cron] Failed to refresh token for ${account.platform} account "${account.accountName}" (${args.accountId}): ${errorMessage}`,
      );

      // Notify the account owner that their token refresh failed
      await ctx.runMutation(internal.notifications.create, {
        userId: account.userId,
        type: "account_disconnected",
        message: `Failed to refresh ${account.platform} token for "${account.accountName}". Please reconnect your account.`,
        metadata: JSON.stringify({
          accountId: args.accountId,
          platform: account.platform,
          error: errorMessage,
        }),
      });

      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Check for expiring tokens and refresh them proactively.
 * Called by a cron job every 6 hours. Finds all active social accounts
 * whose tokens expire within the next 24 hours and refreshes them.
 */
export const checkAndRefreshExpiringTokens = internalAction({
  args: {},
  handler: async (ctx: any) => {
    const now = Date.now();
    const expiryThreshold = now + TOKEN_REFRESH_WINDOW_MS;

    // Fetch all active accounts with tokens expiring soon
    const expiringAccounts = await ctx.runQuery(
      internal.socialAccounts.getExpiringTokenAccounts,
      { expiryThreshold },
    );

    if (expiringAccounts.length === 0) {
      console.log("[cron] No expiring tokens found.");
      return { refreshed: 0, failed: 0, total: 0 };
    }

    console.log(
      `[cron] Found ${expiringAccounts.length} account(s) with expiring tokens. Refreshing...`,
    );

    let refreshed = 0;
    let failed = 0;

    for (const account of expiringAccounts) {
      try {
        const result = await ctx.runAction(
          internal.socialAccountActions.refreshTokenInternal,
          { accountId: account._id },
        );

        if (result.success) {
          refreshed++;
        } else {
          failed++;
          console.warn(
            `[cron] Refresh failed for ${account.platform} account ${account._id}: ${result.error}`,
          );
        }
      } catch (error) {
        failed++;
        console.error(
          `[cron] Unexpected error refreshing ${account.platform} account ${account._id}:`,
          error,
        );
      }
    }

    console.log(
      `[cron] Token refresh complete: ${refreshed} refreshed, ${failed} failed out of ${expiringAccounts.length} total.`,
    );

    return { refreshed, failed, total: expiringAccounts.length };
  },
});

/**
 * Ensure a social account's token is valid before making API calls.
 * If the token is expired or about to expire, refreshes it first.
 *
 * Returns the (potentially refreshed) decrypted access token,
 * or throws an error if the refresh fails.
 *
 * This is called from the publishing flow and analytics fetching
 * to ensure tokens are always fresh before platform API calls.
 */
export const ensureValidToken = internalAction({
  args: { accountId: v.id("socialAccounts") },
  handler: async (ctx: any, args: any): Promise<string> => {
    const account = await ctx.runQuery(
      internal.socialAccounts.getAccountForRefresh,
      { accountId: args.accountId },
    );

    if (!account) {
      throw new Error("Account not found");
    }

    if (!account.isActive) {
      throw new Error("Account is deactivated");
    }

    const encryptionKey = process.env.ENCRYPTION_KEY;
    const now = Date.now();

    // Check if token needs refresh: expired or expiring within 5 minutes
    const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;
    const needsRefresh =
      account.tokenExpiresAt != null &&
      account.tokenExpiresAt <= now + TOKEN_EXPIRY_BUFFER_MS;

    if (needsRefresh) {
      console.log(
        `Token for ${account.platform} account "${account.accountName}" is expired or about to expire. Refreshing...`,
      );

      // Determine which token to use for refresh
      const tokenForRefresh = account.refreshToken ?? account.accessToken;
      if (!tokenForRefresh) {
        throw new Error(
          `No refresh token available for ${account.platform} account "${account.accountName}". Please reconnect.`,
        );
      }

      let decryptedRefreshToken = tokenForRefresh;
      if (encryptionKey) {
        try {
          decryptedRefreshToken = decrypt(tokenForRefresh, encryptionKey);
        } catch (e) {
          if (process.env.NODE_ENV === "production") {
            throw new Error("Token decryption failed in production — tokens must be encrypted");
          }
          // Token may be in plaintext during development
        }
      } else if (process.env.NODE_ENV === "production") {
        throw new Error("ENCRYPTION_KEY is required in production");
      }

      const client = platformClients[account.platform];
      if (!client) {
        throw new Error(`Unknown platform: ${account.platform}`);
      }

      const result = await client.refreshToken(decryptedRefreshToken);

      // Encrypt and store the new tokens
      let encryptedAccessToken = result.accessToken;
      let encryptedRefreshToken = result.refreshToken;

      if (encryptionKey) {
        encryptedAccessToken = encrypt(result.accessToken, encryptionKey);
        if (result.refreshToken) {
          encryptedRefreshToken = encrypt(result.refreshToken, encryptionKey);
        }
      }

      await ctx.runMutation(internal.socialAccounts.updateTokens, {
        accountId: args.accountId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: result.expiresAt,
      });

      console.log(
        `Refreshed token for ${account.platform} account "${account.accountName}" before API call.`,
      );

      // Return the new decrypted access token
      return result.accessToken;
    }

    // Token is still valid — decrypt and return
    let accessToken = account.accessToken;
    if (encryptionKey) {
      try {
        accessToken = decrypt(account.accessToken, encryptionKey);
      } catch (e) {
        if (process.env.NODE_ENV === "production") {
          throw new Error("Token decryption failed in production — tokens must be encrypted");
        }
        // Token may be in plaintext during development
      }
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY is required in production");
    }

    return accessToken;
  },
});
