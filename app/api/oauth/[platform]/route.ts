import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";

type SupportedPlatform = "instagram" | "facebook" | "twitter" | "linkedin";

const SUPPORTED_PLATFORMS: SupportedPlatform[] = [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
];

/**
 * OAuth scopes required for each platform.
 */
const PLATFORM_SCOPES: Record<SupportedPlatform, string> = {
  instagram:
    "instagram_basic,instagram_content_publish,instagram_manage_insights",
  facebook:
    "pages_manage_posts,pages_read_engagement,pages_read_user_content",
  twitter: "tweet.read tweet.write users.read offline.access",
  linkedin: "openid profile email w_member_social",
};

/**
 * Constructs the platform-specific OAuth authorization URL.
 */
function buildAuthorizationUrl(
  platform: SupportedPlatform,
  state: string,
  redirectUri: string,
): string {
  switch (platform) {
    case "instagram":
    case "facebook": {
      // Both Instagram and Facebook use Meta's OAuth dialog.
      // Instagram uses the Facebook Login dialog with instagram-specific scopes.
      const params = new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        redirect_uri: redirectUri,
        state,
        scope: PLATFORM_SCOPES[platform],
        response_type: "code",
      });
      return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
    }

    case "twitter": {
      // Twitter OAuth 2.0 with PKCE — S256 challenge method.
      const codeVerifier = randomBytes(32).toString("hex");
      const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
      const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.TWITTER_CLIENT_ID!,
        redirect_uri: redirectUri,
        scope: PLATFORM_SCOPES.twitter,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });
      // Store code verifier in cookies so callback can use it for token exchange
      // (handled below after building the URL)
      return `https://twitter.com/i/oauth2/authorize?${params.toString()}|${codeVerifier}`;
    }

    case "linkedin": {
      const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        redirect_uri: redirectUri,
        state,
        scope: PLATFORM_SCOPES.linkedin,
      });
      return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    }
  }
}

/**
 * GET /api/oauth/[platform]
 *
 * Initiates the OAuth flow for the specified social platform.
 * Generates a CSRF state token, stores it in an httpOnly cookie,
 * and redirects the user to the platform's authorization page.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  // Validate platform
  if (!SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform)) {
    return NextResponse.json(
      { error: `Unsupported platform: ${platform}` },
      { status: 400 },
    );
  }

  const validPlatform = platform as SupportedPlatform;

  // Generate CSRF state token
  const state = randomBytes(32).toString("hex");

  // Build the callback redirect URI
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/oauth/${validPlatform}/callback`;

  // Build authorization URL
  const rawUrl = buildAuthorizationUrl(validPlatform, state, redirectUri);

  // Handle Twitter code verifier storage (for PKCE S256)
  let authorizationUrl = rawUrl;
  const cookieStore = await cookies();

  if (validPlatform === "twitter" && rawUrl.includes("|")) {
    const [url, codeVerifier] = rawUrl.split("|");
    authorizationUrl = url;
    cookieStore.set("twitter_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });
  }

  // Store state token in httpOnly cookie for CSRF validation in callback
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  // Store the platform so the callback knows which flow to complete
  cookieStore.set("oauth_platform", validPlatform, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(authorizationUrl);
}
