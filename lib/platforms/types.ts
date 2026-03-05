export type SocialPlatform = "instagram" | "facebook" | "twitter" | "linkedin";

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
}

export interface PlatformPostPayload {
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
}

export interface PlatformAnalytics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
}

export interface AccountMetrics {
  followers: number;
  following: number;
  engagementRate: number;
  postsCount: number;
}

/**
 * Describes a media file to be uploaded to a platform.
 * Used by platforms (e.g., Twitter) that require binary upload
 * before referencing media in a post.
 */
export interface MediaUploadInput {
  /** The raw file bytes */
  data: ArrayBuffer;
  /** MIME type, e.g. "image/jpeg", "video/mp4" */
  mimeType: string;
  /** Original filename (used for logging/debugging) */
  filename: string;
  /** File size in bytes */
  fileSize: number;
}

/**
 * Result of uploading media to a platform.
 */
export interface MediaUploadResult {
  success: boolean;
  /** Platform-specific media identifier (e.g., Twitter media_id_string) */
  mediaId?: string;
  error?: string;
}

export interface SocialPlatformClient {
  /** Publish a post to the platform */
  publish(
    accessToken: string,
    accountId: string,
    payload: PlatformPostPayload,
  ): Promise<PublishResult>;

  /**
   * Upload media to the platform and return a platform-specific media ID.
   * Not all platforms need this — Instagram/Facebook/LinkedIn accept URLs directly.
   * Twitter requires media to be uploaded via the v1.1 media/upload endpoint first.
   */
  uploadMedia?(
    accessToken: string,
    media: MediaUploadInput,
  ): Promise<MediaUploadResult>;

  /** Fetch analytics for a specific post */
  getPostAnalytics(
    accessToken: string,
    platformPostId: string,
  ): Promise<PlatformAnalytics>;

  /** Fetch account-level metrics */
  getAccountMetrics(
    accessToken: string,
    accountId: string,
  ): Promise<AccountMetrics>;

  /** Refresh an expired OAuth token */
  refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }>;
}
