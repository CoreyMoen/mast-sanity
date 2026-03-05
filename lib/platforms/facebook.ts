import type {
  SocialPlatformClient,
  PlatformPostPayload,
  PublishResult,
  PlatformAnalytics,
  AccountMetrics,
} from "./types";

const BASE_URL = "https://graph.facebook.com/v21.0";

/**
 * Facebook platform client using the Meta Graph API.
 *
 * Publishes to Facebook Pages (not personal profiles).
 * The accountId refers to the Facebook Page ID, and the access token
 * must be a Page Access Token with the required permissions.
 */
export const facebookClient: SocialPlatformClient = {
  async publish(
    accessToken: string,
    accountId: string,
    payload: PlatformPostPayload,
  ): Promise<PublishResult> {
    try {
      const message = [
        payload.content,
        payload.hashtags?.map((tag) => `#${tag}`).join(" "),
      ]
        .filter(Boolean)
        .join("\n\n");

      const hasMedia = payload.mediaUrls && payload.mediaUrls.length > 0;

      // Publish with or without media
      const endpoint = hasMedia
        ? `${BASE_URL}/${accountId}/photos`
        : `${BASE_URL}/${accountId}/feed`;

      const body: Record<string, string> = {
        access_token: accessToken,
      };

      if (hasMedia) {
        body.url = payload.mediaUrls![0];
        body.caption = message;
      } else {
        body.message = message;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message ?? "Failed to publish to Facebook.",
        };
      }

      const data = await response.json();
      return {
        success: true,
        platformPostId: (data.id ?? data.post_id) as string,
      };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error ? err.message : "Unknown Facebook publish error.",
      };
    }
  },

  async getPostAnalytics(
    accessToken: string,
    platformPostId: string,
  ): Promise<PlatformAnalytics> {
    // Fetch post-level insights
    const metrics = [
      "post_impressions",
      "post_impressions_unique",
      "post_engaged_users",
      "post_clicks",
    ].join(",");

    const insightsResponse = await fetch(
      `${BASE_URL}/${platformPostId}/insights?metric=${metrics}&access_token=${accessToken}`,
    );

    // Fetch reactions, comments, shares from the post object
    const postResponse = await fetch(
      `${BASE_URL}/${platformPostId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`,
    );

    const insightsMap = new Map<string, number>();

    if (insightsResponse.ok) {
      const insights = await insightsResponse.json();
      for (const entry of insights.data ?? []) {
        insightsMap.set(entry.name, entry.values?.[0]?.value ?? 0);
      }
    }

    let likes = 0;
    let comments = 0;
    let shares = 0;

    if (postResponse.ok) {
      const post = await postResponse.json();
      likes = post.likes?.summary?.total_count ?? 0;
      comments = post.comments?.summary?.total_count ?? 0;
      shares = post.shares?.count ?? 0;
    }

    return {
      impressions: insightsMap.get("post_impressions") ?? 0,
      reach: insightsMap.get("post_impressions_unique") ?? 0,
      likes,
      comments,
      shares,
      saves: 0, // Facebook does not expose saves via API
      clicks: insightsMap.get("post_clicks") ?? 0,
    };
  },

  async getAccountMetrics(
    accessToken: string,
    accountId: string,
  ): Promise<AccountMetrics> {
    // Fetch page fan count and posted content count
    const pageResponse = await fetch(
      `${BASE_URL}/${accountId}?fields=fan_count,published_posts.summary(true)&access_token=${accessToken}`,
    );

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch Facebook page metrics: ${pageResponse.statusText}`);
    }

    const page = await pageResponse.json();

    // Fetch page-level engagement insights
    const insightsResponse = await fetch(
      `${BASE_URL}/${accountId}/insights?metric=page_engaged_users,page_post_engagements&period=day&access_token=${accessToken}`,
    );

    let engagementRate = 0;
    if (insightsResponse.ok) {
      const insights = await insightsResponse.json();
      const engaged = insights.data?.[0]?.values?.[0]?.value ?? 0;
      const fans = page.fan_count ?? 1;
      engagementRate = fans > 0 ? (engaged / fans) * 100 : 0;
    }

    return {
      followers: page.fan_count ?? 0,
      following: 0, // Facebook Pages do not have a "following" count
      engagementRate,
      postsCount: page.published_posts?.summary?.total_count ?? 0,
    };
  },

  async refreshToken(
    refreshTokenValue: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }> {
    // Facebook long-lived Page tokens do not expire, but user tokens can be
    // exchanged for long-lived versions. This exchanges a short-lived token
    // for a long-lived one.
    const response = await fetch(
      `${BASE_URL}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: process.env.META_APP_ID!,
          client_secret: process.env.META_APP_SECRET!,
          fb_exchange_token: refreshTokenValue,
        }).toString(),
    );

    if (!response.ok) {
      throw new Error(`Failed to refresh Facebook token: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.access_token,
      expiresAt: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : undefined,
    };
  },
};
