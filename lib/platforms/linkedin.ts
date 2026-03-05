import type {
  SocialPlatformClient,
  PlatformPostPayload,
  PublishResult,
  PlatformAnalytics,
  AccountMetrics,
} from "./types";

const BASE_URL = "https://api.linkedin.com/v2";

/**
 * LinkedIn platform client using the LinkedIn Marketing API.
 *
 * Uses the UGC Posts API for publishing and the Share Statistics API
 * for analytics. The accountId represents the LinkedIn person URN
 * (e.g., "urn:li:person:abc123") or organization URN.
 */
export const linkedinClient: SocialPlatformClient = {
  async publish(
    accessToken: string,
    accountId: string,
    payload: PlatformPostPayload,
  ): Promise<PublishResult> {
    try {
      const text = [
        payload.content,
        payload.hashtags?.map((tag) => `#${tag}`).join(" "),
      ]
        .filter(Boolean)
        .join("\n\n");

      // Determine the author URN — accountId should be a full URN
      const authorUrn = accountId.startsWith("urn:li:")
        ? accountId
        : `urn:li:person:${accountId}`;

      // Build the UGC post body
      const ugcPost: Record<string, unknown> = {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text,
            },
            shareMediaCategory:
              payload.mediaUrls && payload.mediaUrls.length > 0
                ? "IMAGE"
                : "NONE",
            ...(payload.mediaUrls && payload.mediaUrls.length > 0
              ? {
                  media: payload.mediaUrls.map((url) => ({
                    status: "READY",
                    originalUrl: url,
                    description: {
                      text: payload.content.substring(0, 200),
                    },
                  })),
                }
              : {}),
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      const response = await fetch(`${BASE_URL}/ugcPosts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(ugcPost),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error:
            error.message ??
            error.serviceErrorCode ??
            "Failed to publish to LinkedIn.",
        };
      }

      // LinkedIn returns the post URN in the x-restli-id header
      const postUrn =
        response.headers.get("x-restli-id") ?? (await response.json()).id;

      return {
        success: true,
        platformPostId: postUrn as string,
      };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error ? err.message : "Unknown LinkedIn publish error.",
      };
    }
  },

  async getPostAnalytics(
    accessToken: string,
    platformPostId: string,
  ): Promise<PlatformAnalytics> {
    // URL-encode the share URN for the query parameter
    const encodedUrn = encodeURIComponent(platformPostId);

    const response = await fetch(
      `${BASE_URL}/socialActions/${encodedUrn}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch LinkedIn post analytics: ${response.statusText}`);
    }

    const data = await response.json();

    // Fetch share statistics for impressions and clicks
    const statsResponse = await fetch(
      `${BASE_URL}/organizationalEntityShareStatistics?q=organizationalEntity&shares[0]=${encodedUrn}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      },
    );

    let impressions = 0;
    let clicks = 0;
    let reach = 0;

    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      const totalShareStatistics =
        stats.elements?.[0]?.totalShareStatistics ?? {};
      impressions = totalShareStatistics.impressionCount ?? 0;
      clicks = totalShareStatistics.clickCount ?? 0;
      reach = totalShareStatistics.uniqueImpressionsCount ?? 0;
    }

    return {
      impressions,
      reach,
      likes: data.likesSummary?.totalLikes ?? 0,
      comments: data.commentsSummary?.totalFirstLevelComments ?? 0,
      shares: 0, // LinkedIn does not expose reshare counts via this endpoint
      saves: 0,
      clicks,
    };
  },

  async getAccountMetrics(
    accessToken: string,
    accountId: string,
  ): Promise<AccountMetrics> {
    // For organization pages, use organizationalEntityFollowerStatistics
    const isOrg = accountId.includes("organization");
    const encodedUrn = encodeURIComponent(
      accountId.startsWith("urn:li:")
        ? accountId
        : `urn:li:${isOrg ? "organization" : "person"}:${accountId}`,
    );

    if (isOrg) {
      const response = await fetch(
        `${BASE_URL}/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${encodedUrn}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch LinkedIn org metrics: ${response.statusText}`,
        );
      }

      const data = await response.json();
      const stats = data.elements?.[0] ?? {};

      return {
        followers: stats.followerCounts?.organicFollowerCount ?? 0,
        following: 0,
        engagementRate: 0,
        postsCount: 0,
      };
    }

    // For personal profiles, fetch basic profile info
    const response = await fetch(`${BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch LinkedIn profile metrics: ${response.statusText}`);
    }

    return {
      followers: 0, // Personal profile follower count requires separate permissions
      following: 0,
      engagementRate: 0,
      postsCount: 0,
    };
  },

  async refreshToken(
    refreshTokenValue: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }> {
    const response = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshTokenValue,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }).toString(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to refresh LinkedIn token: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : undefined,
    };
  },
};
