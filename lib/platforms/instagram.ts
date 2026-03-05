import type {
  SocialPlatformClient,
  PlatformPostPayload,
  PublishResult,
  PlatformAnalytics,
  AccountMetrics,
} from "./types";

const BASE_URL = "https://graph.facebook.com/v21.0";

/**
 * Instagram platform client using the Meta Graph API.
 *
 * Publishing to Instagram via the Content Publishing API requires:
 *   1. Create a media container (image/video/carousel)
 *   2. Publish the container to the Instagram account
 */
export const instagramClient: SocialPlatformClient = {
  async publish(
    accessToken: string,
    accountId: string,
    payload: PlatformPostPayload,
  ): Promise<PublishResult> {
    try {
      // Step 1: Create media container
      const mediaUrl = payload.mediaUrls?.[0];
      if (!mediaUrl) {
        return {
          success: false,
          error: "Instagram requires at least one media attachment.",
        };
      }

      const caption = [
        payload.content,
        payload.hashtags?.map((tag) => `#${tag}`).join(" "),
      ]
        .filter(Boolean)
        .join("\n\n");

      const containerResponse = await fetch(
        `${BASE_URL}/${accountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: mediaUrl,
            caption,
            access_token: accessToken,
          }),
        },
      );

      if (!containerResponse.ok) {
        const error = await containerResponse.json();
        return {
          success: false,
          error: error.error?.message ?? "Failed to create media container.",
        };
      }

      const container = await containerResponse.json();
      const containerId = container.id as string;

      // Step 2: Publish the container
      const publishResponse = await fetch(
        `${BASE_URL}/${accountId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: accessToken,
          }),
        },
      );

      if (!publishResponse.ok) {
        const error = await publishResponse.json();
        return {
          success: false,
          error: error.error?.message ?? "Failed to publish media.",
        };
      }

      const published = await publishResponse.json();
      return {
        success: true,
        platformPostId: published.id as string,
      };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error ? err.message : "Unknown Instagram publish error.",
      };
    }
  },

  async getPostAnalytics(
    accessToken: string,
    platformPostId: string,
  ): Promise<PlatformAnalytics> {
    const metrics = [
      "impressions",
      "reach",
      "likes",
      "comments",
      "shares",
      "saved",
      "video_views",
    ].join(",");

    const response = await fetch(
      `${BASE_URL}/${platformPostId}/insights?metric=${metrics}&access_token=${accessToken}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Instagram post insights: ${response.statusText}`);
    }

    const data = await response.json();
    const insightsMap = new Map<string, number>();

    for (const entry of data.data ?? []) {
      insightsMap.set(entry.name, entry.values?.[0]?.value ?? 0);
    }

    return {
      impressions: insightsMap.get("impressions") ?? 0,
      reach: insightsMap.get("reach") ?? 0,
      likes: insightsMap.get("likes") ?? 0,
      comments: insightsMap.get("comments") ?? 0,
      shares: insightsMap.get("shares") ?? 0,
      saves: insightsMap.get("saved") ?? 0,
      clicks: 0, // Instagram insights API does not expose clicks directly
    };
  },

  async getAccountMetrics(
    accessToken: string,
    accountId: string,
  ): Promise<AccountMetrics> {
    // Fetch basic account info
    const profileResponse = await fetch(
      `${BASE_URL}/${accountId}?fields=followers_count,follows_count,media_count&access_token=${accessToken}`,
    );

    if (!profileResponse.ok) {
      throw new Error(`Failed to fetch Instagram account metrics: ${profileResponse.statusText}`);
    }

    const profile = await profileResponse.json();

    // Fetch engagement rate from account insights (last 30 days)
    const insightsResponse = await fetch(
      `${BASE_URL}/${accountId}/insights?metric=accounts_engaged&period=day&metric_type=total_value&access_token=${accessToken}`,
    );

    let engagementRate = 0;
    if (insightsResponse.ok) {
      const insights = await insightsResponse.json();
      const engaged = insights.data?.[0]?.total_value?.value ?? 0;
      const followers = profile.followers_count ?? 1;
      engagementRate = followers > 0 ? (engaged / followers) * 100 : 0;
    }

    return {
      followers: profile.followers_count ?? 0,
      following: profile.follows_count ?? 0,
      engagementRate,
      postsCount: profile.media_count ?? 0,
    };
  },

  async refreshToken(
    refreshTokenValue: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }> {
    // Instagram long-lived tokens are refreshed by exchanging the current token.
    // Long-lived tokens last 60 days and can be refreshed before they expire.
    const response = await fetch(
      `${BASE_URL}/oauth/access_token?grant_type=ig_exchange_token&client_secret=${process.env.META_APP_SECRET}&access_token=${refreshTokenValue}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to refresh Instagram token: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.access_token, // Instagram reuses the same long-lived token
      expiresAt: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : undefined,
    };
  },
};
