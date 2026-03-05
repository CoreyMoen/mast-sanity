import type {
  SocialPlatformClient,
  PlatformPostPayload,
  PublishResult,
  PlatformAnalytics,
  AccountMetrics,
  MediaUploadInput,
  MediaUploadResult,
} from "./types";

const BASE_URL = "https://api.twitter.com/2";
const UPLOAD_BASE_URL = "https://upload.twitter.com/1.1";

/**
 * Twitter media upload size limits.
 * Images up to 5MB can use simple upload; larger files and videos
 * must use the chunked upload flow (INIT/APPEND/FINALIZE).
 */
const SIMPLE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const CHUNK_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB per chunk

/**
 * Determine the Twitter media category from a MIME type string.
 */
function getTwitterMediaCategory(
  mimeType: string,
): "tweet_image" | "tweet_gif" | "tweet_video" {
  if (mimeType === "image/gif") return "tweet_gif";
  if (mimeType.startsWith("video/")) return "tweet_video";
  return "tweet_image";
}

/**
 * Convert an ArrayBuffer to a base64-encoded string.
 * Works in both Node.js and edge/browser environments.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Use Buffer if available (Node.js / Convex runtime), otherwise manual conversion
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Upload media using the simple (non-chunked) upload endpoint.
 * Suitable for images <= 5 MB.
 *
 * The v1.1 media/upload endpoint supports OAuth 2.0 User Context
 * (Bearer token with user authentication) as of late 2022.
 */
async function simpleUpload(
  accessToken: string,
  media: MediaUploadInput,
): Promise<MediaUploadResult> {
  const base64Data = arrayBufferToBase64(media.data);

  const params = new URLSearchParams({
    media_data: base64Data,
    media_category: getTwitterMediaCategory(media.mimeType),
  });

  const url = `${UPLOAD_BASE_URL}/media/upload.json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    return {
      success: false,
      error: `Twitter simple media upload failed (${response.status}): ${error}`,
    };
  }

  const data = await response.json();
  return {
    success: true,
    mediaId: data.media_id_string,
  };
}

/**
 * Upload media using the chunked upload flow (INIT -> APPEND -> FINALIZE).
 * Required for videos and files larger than 5 MB.
 *
 * Flow:
 *   1. INIT:     Tell Twitter the file size, MIME type, and category.
 *   2. APPEND:   Send the file in chunks (up to 4 MB each, base64-encoded).
 *   3. FINALIZE: Signal that all chunks have been uploaded.
 *   4. STATUS:   (For async video processing) Poll until processing is done.
 */
async function chunkedUpload(
  accessToken: string,
  media: MediaUploadInput,
): Promise<MediaUploadResult> {
  const mediaCategory = getTwitterMediaCategory(media.mimeType);
  const url = `${UPLOAD_BASE_URL}/media/upload.json`;
  const authHeader = `Bearer ${accessToken}`;

  // ── Step 1: INIT ──────────────────────────────────────────────────────
  const initParams = new URLSearchParams({
    command: "INIT",
    total_bytes: String(media.fileSize),
    media_type: media.mimeType,
    media_category: mediaCategory,
  });

  const initResponse = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: initParams.toString(),
  });

  if (!initResponse.ok) {
    const error = await initResponse.text();
    return {
      success: false,
      error: `Twitter chunked INIT failed (${initResponse.status}): ${error}`,
    };
  }

  const initData = await initResponse.json();
  const mediaIdString: string = initData.media_id_string;

  // ── Step 2: APPEND (send file in chunks) ──────────────────────────────
  const totalBytes = media.data.byteLength;
  let segmentIndex = 0;
  let offset = 0;

  while (offset < totalBytes) {
    const end = Math.min(offset + CHUNK_SIZE_BYTES, totalBytes);
    const chunk = media.data.slice(offset, end);
    const chunkBase64 = arrayBufferToBase64(chunk);

    const appendParams = new URLSearchParams({
      command: "APPEND",
      media_id: mediaIdString,
      segment_index: String(segmentIndex),
      media_data: chunkBase64,
    });

    const appendResponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: appendParams.toString(),
    });

    // APPEND returns 2xx with an empty body on success
    if (!appendResponse.ok) {
      const error = await appendResponse.text();
      return {
        success: false,
        error: `Twitter chunked APPEND failed at segment ${segmentIndex} (${appendResponse.status}): ${error}`,
      };
    }

    offset = end;
    segmentIndex++;
  }

  // ── Step 3: FINALIZE ──────────────────────────────────────────────────
  const finalizeParams = new URLSearchParams({
    command: "FINALIZE",
    media_id: mediaIdString,
  });

  const finalizeResponse = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: finalizeParams.toString(),
  });

  if (!finalizeResponse.ok) {
    const error = await finalizeResponse.text();
    return {
      success: false,
      error: `Twitter chunked FINALIZE failed (${finalizeResponse.status}): ${error}`,
    };
  }

  const finalizeData = await finalizeResponse.json();

  // ── Step 4: STATUS (poll for async video processing) ──────────────────
  if (finalizeData.processing_info) {
    const statusResult = await pollMediaProcessing(
      accessToken,
      mediaIdString,
      finalizeData.processing_info,
    );
    if (!statusResult.success) {
      return statusResult;
    }
  }

  return {
    success: true,
    mediaId: mediaIdString,
  };
}

/**
 * Poll the media STATUS endpoint until processing is complete.
 * Twitter processes videos/GIFs asynchronously after FINALIZE.
 */
async function pollMediaProcessing(
  accessToken: string,
  mediaId: string,
  processingInfo: {
    state: string;
    check_after_secs?: number;
    error?: { message: string };
  },
): Promise<MediaUploadResult> {
  let info = processingInfo;
  const maxAttempts = 30; // Cap polling to prevent runaway loops
  let attempts = 0;

  while (
    info.state !== "succeeded" &&
    info.state !== "failed" &&
    attempts < maxAttempts
  ) {
    const waitSeconds = info.check_after_secs ?? 5;
    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));

    const statusUrl = `${UPLOAD_BASE_URL}/media/upload.json?command=STATUS&media_id=${mediaId}`;

    const statusResponse = await fetch(statusUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!statusResponse.ok) {
      const error = await statusResponse.text();
      return {
        success: false,
        error: `Twitter media STATUS check failed (${statusResponse.status}): ${error}`,
      };
    }

    const statusData = await statusResponse.json();
    info = statusData.processing_info ?? { state: "succeeded" };
    attempts++;
  }

  if (info.state === "failed") {
    return {
      success: false,
      error: `Twitter media processing failed: ${info.error?.message ?? "Unknown processing error"}`,
    };
  }

  if (info.state !== "succeeded") {
    return {
      success: false,
      error: `Twitter media processing timed out after ${maxAttempts} status checks`,
    };
  }

  return { success: true, mediaId };
}

/**
 * X/Twitter platform client using the Twitter API v2.
 *
 * Uses OAuth 2.0 with PKCE for authorization and Bearer tokens for API calls.
 * Media upload uses the v1.1 media/upload endpoint (which also supports
 * OAuth 2.0 User Context since late 2022).
 */
export const twitterClient: SocialPlatformClient = {
  async publish(
    accessToken: string,
    _accountId: string,
    payload: PlatformPostPayload,
  ): Promise<PublishResult> {
    try {
      const text = [
        payload.content,
        payload.hashtags?.map((tag) => `#${tag}`).join(" "),
      ]
        .filter(Boolean)
        .join("\n\n");

      // Twitter v2 tweet creation
      const body: Record<string, unknown> = { text };

      // If mediaUrls are present, they should be platform-specific media IDs
      // (obtained from a prior uploadMedia() call). Attach them to the tweet.
      if (payload.mediaUrls && payload.mediaUrls.length > 0) {
        body.media = {
          media_ids: payload.mediaUrls,
        };
      }

      const response = await fetch(`${BASE_URL}/tweets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error:
            error.detail ??
            error.title ??
            "Failed to publish tweet.",
        };
      }

      const data = await response.json();
      return {
        success: true,
        platformPostId: data.data?.id as string,
      };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error ? err.message : "Unknown Twitter publish error.",
      };
    }
  },

  /**
   * Upload media to Twitter via the v1.1 media/upload endpoint.
   *
   * Uses simple upload for images <= 5 MB, and chunked upload for
   * larger files and videos. Returns the Twitter media_id_string
   * which must be passed to the publish() method in the payload's
   * mediaUrls array.
   */
  async uploadMedia(
    accessToken: string,
    media: MediaUploadInput,
  ): Promise<MediaUploadResult> {
    try {
      const isVideo = media.mimeType.startsWith("video/");
      const isGif = media.mimeType === "image/gif";
      const isLarge = media.fileSize > SIMPLE_UPLOAD_MAX_BYTES;

      // Videos, animated GIFs, and large files require chunked upload
      if (isVideo || isGif || isLarge) {
        return await chunkedUpload(accessToken, media);
      }
      return await simpleUpload(accessToken, media);
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Unknown Twitter media upload error.",
      };
    }
  },

  async getPostAnalytics(
    accessToken: string,
    platformPostId: string,
  ): Promise<PlatformAnalytics> {
    const fields = [
      "public_metrics",
      "non_public_metrics",
      "organic_metrics",
    ].join(",");

    const response = await fetch(
      `${BASE_URL}/tweets/${platformPostId}?tweet.fields=${fields}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tweet metrics: ${response.statusText}`);
    }

    const data = await response.json();
    const pub = data.data?.public_metrics ?? {};
    const nonPub = data.data?.non_public_metrics ?? {};
    const organic = data.data?.organic_metrics ?? {};

    return {
      impressions: nonPub.impression_count ?? organic.impression_count ?? 0,
      reach: 0, // Twitter does not provide a reach metric
      likes: pub.like_count ?? 0,
      comments: pub.reply_count ?? 0,
      shares: pub.retweet_count + (pub.quote_count ?? 0),
      saves: pub.bookmark_count ?? 0,
      clicks: nonPub.url_link_clicks ?? organic.url_link_clicks ?? 0,
    };
  },

  async getAccountMetrics(
    accessToken: string,
    accountId: string,
  ): Promise<AccountMetrics> {
    const fields = ["public_metrics"].join(",");

    const response = await fetch(
      `${BASE_URL}/users/${accountId}?user.fields=${fields}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Twitter user metrics: ${response.statusText}`,
      );
    }

    const data = await response.json();
    const metrics = data.data?.public_metrics ?? {};

    return {
      followers: metrics.followers_count ?? 0,
      following: metrics.following_count ?? 0,
      engagementRate: 0, // Must be calculated from individual tweet metrics
      postsCount: metrics.tweet_count ?? 0,
    };
  },

  async refreshToken(
    refreshTokenValue: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }> {
    const clientId = process.env.TWITTER_CLIENT_ID!;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET!;

    const response = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshTokenValue,
        client_id: clientId,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to refresh Twitter token: ${response.statusText}`,
      );
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
