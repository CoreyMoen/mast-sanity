import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/utils/encryption";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

type SupportedPlatform = "instagram" | "facebook" | "twitter" | "linkedin";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Exchange an authorization code for access and refresh tokens.
 */
async function exchangeCodeForTokens(
  platform: SupportedPlatform,
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  platformAccountId: string;
  accountName: string;
  profileImageUrl?: string;
}> {
  switch (platform) {
    case "instagram":
    case "facebook": {
      // Step 1: Exchange code for short-lived token
      const tokenResponse = await fetch(
        "https://graph.facebook.com/v21.0/oauth/access_token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.META_APP_ID!,
            client_secret: process.env.META_APP_SECRET!,
            code,
            redirect_uri: redirectUri,
          }).toString(),
        },
      );

      if (!tokenResponse.ok) {
        const err = await tokenResponse.json();
        throw new Error(
          err.error?.message ?? `Token exchange failed: ${tokenResponse.statusText}`,
        );
      }

      const tokenData = await tokenResponse.json();
      const shortLivedToken = tokenData.access_token as string;

      // Step 2: Exchange for long-lived token
      const longLivedResponse = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?` +
          new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: process.env.META_APP_ID!,
            client_secret: process.env.META_APP_SECRET!,
            fb_exchange_token: shortLivedToken,
          }).toString(),
      );

      let accessToken = shortLivedToken;
      let expiresIn = tokenData.expires_in;

      if (longLivedResponse.ok) {
        const longLivedData = await longLivedResponse.json();
        accessToken = longLivedData.access_token;
        expiresIn = longLivedData.expires_in;
      }

      if (platform === "instagram") {
        // Fetch Instagram business account via connected Facebook pages
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`,
        );
        const pagesData = await pagesResponse.json();
        const page = pagesData.data?.[0];

        if (page) {
          const igResponse = await fetch(
            `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`,
          );
          const igData = await igResponse.json();
          const igAccountId = igData.instagram_business_account?.id;

          if (igAccountId) {
            const igProfileResponse = await fetch(
              `https://graph.facebook.com/v21.0/${igAccountId}?fields=username,profile_picture_url&access_token=${accessToken}`,
            );
            const igProfile = await igProfileResponse.json();

            return {
              accessToken,
              refreshToken: accessToken,
              expiresIn,
              platformAccountId: igAccountId,
              accountName: igProfile.username ?? "Instagram Account",
              profileImageUrl: igProfile.profile_picture_url,
            };
          }
        }

        throw new Error(
          "No Instagram Business account found. Ensure your Instagram account is connected to a Facebook Page.",
        );
      }

      // Facebook: Get page info
      const meResponse = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id,name,picture&access_token=${accessToken}`,
      );
      const meData = await meResponse.json();

      return {
        accessToken,
        refreshToken: accessToken,
        expiresIn,
        platformAccountId: meData.id,
        accountName: meData.name ?? "Facebook Page",
        profileImageUrl: meData.picture?.data?.url,
      };
    }

    case "twitter": {
      const clientId = process.env.TWITTER_CLIENT_ID!;
      const clientSecret = process.env.TWITTER_CLIENT_SECRET!;

      const tokenResponse = await fetch(
        "https://api.twitter.com/2/oauth2/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            code_verifier: codeVerifier ?? "",
          }).toString(),
        },
      );

      if (!tokenResponse.ok) {
        const err = await tokenResponse.json();
        throw new Error(
          err.error_description ?? `Twitter token exchange failed: ${tokenResponse.statusText}`,
        );
      }

      const tokenData = await tokenResponse.json();

      // Fetch user profile
      const userResponse = await fetch(
        "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        },
      );

      let platformAccountId = "";
      let accountName = "X Account";
      let profileImageUrl: string | undefined;

      if (userResponse.ok) {
        const userData = await userResponse.json();
        platformAccountId = userData.data?.id ?? "";
        accountName = `@${userData.data?.username ?? "unknown"}`;
        profileImageUrl = userData.data?.profile_image_url;
      }

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        platformAccountId,
        accountName,
        profileImageUrl,
      };
    }

    case "linkedin": {
      const tokenResponse = await fetch(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          }).toString(),
        },
      );

      if (!tokenResponse.ok) {
        const err = await tokenResponse.json();
        throw new Error(
          err.error_description ?? `LinkedIn token exchange failed: ${tokenResponse.statusText}`,
        );
      }

      const tokenData = await tokenResponse.json();

      // Fetch user profile via OpenID Connect userinfo endpoint
      const profileResponse = await fetch(
        "https://api.linkedin.com/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        },
      );

      let platformAccountId = "";
      let accountName = "LinkedIn Account";
      let profileImageUrl: string | undefined;

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        platformAccountId = profile.sub ?? "";
        accountName = profile.name
          ?? ([profile.given_name, profile.family_name].filter(Boolean).join(" ")
          || "LinkedIn Account");
        profileImageUrl = profile.picture;
      }

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        platformAccountId,
        accountName,
        profileImageUrl,
      };
    }
  }
}

/**
 * GET /api/oauth/[platform]/callback
 *
 * Handles the OAuth callback from the social platform.
 * Extracts the authorization code, exchanges it for tokens,
 * encrypts the tokens, and stores the connected account in Convex.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const accountsUrl = `${baseUrl}/dashboard/accounts`;

  // Handle OAuth errors from the platform
  if (error) {
    const message = encodeURIComponent(
      errorDescription ?? `OAuth authorization denied: ${error}`,
    );
    return NextResponse.redirect(`${accountsUrl}?error=${message}`);
  }

  // Validate authorization code
  if (!code) {
    return NextResponse.redirect(
      `${accountsUrl}?error=${encodeURIComponent("Missing authorization code.")}`,
    );
  }

  // Validate CSRF state token
  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;

  if (!state || state !== storedState) {
    return NextResponse.redirect(
      `${accountsUrl}?error=${encodeURIComponent("Invalid state parameter. Please try again.")}`,
    );
  }

  // Clean up state cookie
  cookieStore.delete("oauth_state");
  cookieStore.delete("oauth_platform");

  try {
    const validPlatform = platform as SupportedPlatform;
    const redirectUri = `${baseUrl}/api/oauth/${validPlatform}/callback`;

    // Retrieve code verifier for Twitter PKCE
    let codeVerifier: string | undefined;
    if (validPlatform === "twitter") {
      codeVerifier = cookieStore.get("twitter_code_verifier")?.value;
      cookieStore.delete("twitter_code_verifier");
    }

    // Exchange code for tokens
    const tokenResult = await exchangeCodeForTokens(
      validPlatform,
      code,
      redirectUri,
      codeVerifier,
    );

    // Encrypt tokens before storing
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const encryptedAccessToken = encrypt(
      tokenResult.accessToken,
      encryptionKey,
    );
    const encryptedRefreshToken = tokenResult.refreshToken
      ? encrypt(tokenResult.refreshToken, encryptionKey)
      : undefined;

    // Get authenticated user's Clerk token for Convex
    const { getToken } = await auth();
    const convexToken = await getToken({ template: "convex" });

    if (!convexToken) {
      return NextResponse.redirect(
        `${accountsUrl}?error=${encodeURIComponent("Not authenticated. Please sign in and try again.")}`,
      );
    }

    // Store connected account in Convex
    convex.setAuth(convexToken);
    await convex.mutation(api.socialAccounts.connect, {
      platform: validPlatform,
      platformAccountId: tokenResult.platformAccountId,
      accountName: tokenResult.accountName,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt: tokenResult.expiresIn
        ? Date.now() + tokenResult.expiresIn * 1000
        : undefined,
      profileImageUrl: tokenResult.profileImageUrl,
    });

    return NextResponse.redirect(
      `${accountsUrl}?success=${encodeURIComponent(`${validPlatform} account connected successfully!`)}`,
    );
  } catch (err) {
    console.error(`OAuth callback error for ${platform}:`, err);
    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred during account connection.";
    return NextResponse.redirect(
      `${accountsUrl}?error=${encodeURIComponent(message)}`,
    );
  }
}
