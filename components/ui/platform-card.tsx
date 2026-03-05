"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Platform brand colors and display metadata.
 */
const PLATFORM_STYLES: Record<
  string,
  { gradient: string; bg: string; text: string; label: string }
> = {
  instagram: {
    gradient: "from-purple-600 via-pink-500 to-orange-400",
    bg: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    text: "text-pink-600",
    label: "Instagram",
  },
  facebook: {
    gradient: "from-[#1877F2] to-[#1877F2]",
    bg: "bg-[#1877F2]",
    text: "text-[#1877F2]",
    label: "Facebook",
  },
  twitter: {
    gradient: "from-black to-black",
    bg: "bg-black",
    text: "text-black",
    label: "X (Twitter)",
  },
  linkedin: {
    gradient: "from-[#0A66C2] to-[#0A66C2]",
    bg: "bg-[#0A66C2]",
    text: "text-[#0A66C2]",
    label: "LinkedIn",
  },
};

/**
 * SVG icons for each platform. Using inline SVGs for brand accuracy
 * since Lucide does not include official brand logos.
 */
function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const baseClass = cn("h-6 w-6 shrink-0", className);

  switch (platform) {
    case "instagram":
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "twitter":
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    default:
      return null;
  }
}

interface PlatformCardProps {
  /** Platform identifier */
  platform: string;
  /** Whether the account is currently connected */
  isConnected: boolean;
  /** Display name of the connected account */
  accountName?: string;
  /** Profile image URL of the connected account */
  profileImageUrl?: string;
  /** Called when the user clicks "Connect" */
  onConnect: () => void;
  /** Called when the user clicks "Disconnect" */
  onDisconnect: () => void;
  /** Whether a connect/disconnect action is in progress */
  isLoading?: boolean;
  /** Whether the user has reached their tier's account limit (disables connect) */
  limitReached?: boolean;
}

export function PlatformCard({
  platform,
  isConnected,
  accountName,
  profileImageUrl,
  onConnect,
  onDisconnect,
  isLoading = false,
  limitReached = false,
}: PlatformCardProps) {
  const style = PLATFORM_STYLES[platform] ?? {
    gradient: "from-gray-500 to-gray-500",
    bg: "bg-gray-500",
    text: "text-gray-600",
    label: platform,
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md",
        isConnected ? "border-green-200" : "border-gray-200",
      )}
    >
      {/* Connected indicator badge */}
      {isConnected && (
        <div className="absolute -top-2.5 right-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Connected
          </span>
        </div>
      )}

      <div className="p-6">
        {/* Platform header */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white",
              style.gradient,
            )}
          >
            <PlatformIcon platform={platform} className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {style.label}
            </h3>
            {isConnected && accountName && (
              <p className="text-xs text-gray-500">{accountName}</p>
            )}
          </div>
        </div>

        {/* Account info (when connected) */}
        {isConnected && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={accountName ?? "Profile"}
                width={32}
                height={32}
                className="rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
                  style.gradient,
                )}
              >
                {(accountName ?? platform)[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {accountName}
              </p>
              <p className="text-xs text-green-600">Active</p>
            </div>
          </div>
        )}

        {/* Not connected state */}
        {!isConnected && (
          <p className="mt-4 text-sm text-gray-500">
            {limitReached
              ? "Upgrade your plan to connect more accounts."
              : `Connect your ${style.label} account to start scheduling posts.`}
          </p>
        )}

        {/* Action button */}
        <div className="mt-4">
          {isConnected ? (
            <button
              type="button"
              onClick={onDisconnect}
              disabled={isLoading}
              className={cn(
                "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {isLoading ? "Disconnecting..." : "Disconnect"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={isLoading || limitReached}
              className={cn(
                "w-full rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                limitReached
                  ? "bg-gray-100 text-gray-400 border border-gray-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700",
              )}
            >
              {isLoading ? "Connecting..." : limitReached ? "Limit Reached" : "Connect"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
