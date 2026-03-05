"use client";

import Image from "next/image";
import { Instagram, Facebook, Twitter, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_CHAR_LIMITS } from "@/lib/utils/validation";

interface PlatformPreviewProps {
  platform: string;
  content: string;
  hashtags: string[];
  accountName?: string;
  accountImageUrl?: string;
}

const platformConfig: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    maxDisplay: number;
  }
> = {
  instagram: {
    label: "Instagram",
    icon: Instagram,
    color: "text-pink-600",
    bgColor: "bg-gradient-to-br from-pink-50 to-purple-50",
    borderColor: "border-pink-200",
    maxDisplay: 2200,
  },
  twitter: {
    label: "X / Twitter",
    icon: Twitter,
    color: "text-sky-500",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    maxDisplay: 280,
  },
  facebook: {
    label: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    maxDisplay: 63206,
  },
  linkedin: {
    label: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    maxDisplay: 3000,
  },
};

function truncateContent(content: string, limit: number): string {
  if (content.length <= limit) return content;
  return content.slice(0, limit - 3) + "...";
}

export function PlatformPreview({
  platform,
  content,
  hashtags,
  accountName,
  accountImageUrl,
}: PlatformPreviewProps) {
  const config = platformConfig[platform];
  if (!config) return null;

  const Icon = config.icon;
  const limit = PLATFORM_CHAR_LIMITS[platform] ?? config.maxDisplay;
  const hashtagString =
    hashtags.length > 0 ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : "";

  // Build the full post text as it would appear on the platform
  let displayContent = content;

  if (platform === "instagram") {
    // Instagram: show content with hashtags below
    displayContent = truncateContent(content + hashtagString, limit);
  } else if (platform === "twitter") {
    // Twitter: very short, might include hashtags in remaining space
    const withTags = content + (hashtags.length > 0 ? " " + hashtags.map((h) => `#${h}`).join(" ") : "");
    displayContent = truncateContent(withTags, limit);
  } else if (platform === "linkedin") {
    // LinkedIn: professional style with hashtags
    displayContent = truncateContent(content + hashtagString, limit);
  } else {
    // Facebook: content as-is
    displayContent = truncateContent(content, limit);
  }

  const charCount = displayContent.length;
  const exceeded = charCount > limit;

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        config.bgColor,
        config.borderColor,
      )}
    >
      {/* Platform header */}
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn("h-5 w-5", config.color)} />
        <span className={cn("text-sm font-semibold", config.color)}>
          {config.label}
        </span>
        <span className="ml-auto text-xs text-gray-400">Preview</span>
      </div>

      {/* Mock post card */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        {/* User row */}
        <div className="mb-3 flex items-center gap-2">
          {accountImageUrl ? (
            <Image
              src={accountImageUrl}
              alt={accountName ?? "Profile"}
              width={32}
              height={32}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {(accountName ?? "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {accountName ?? "Your Name"}
            </p>
            <p className="text-xs text-gray-400">Just now</p>
          </div>
        </div>

        {/* Post content */}
        {displayContent ? (
          <p
            className={cn(
              "whitespace-pre-wrap text-sm leading-relaxed",
              exceeded ? "text-red-600" : "text-gray-800",
            )}
          >
            {displayContent}
          </p>
        ) : (
          <p className="text-sm italic text-gray-400">
            Your post content will appear here...
          </p>
        )}

        {/* Instagram-specific: media placeholder */}
        {platform === "instagram" && (
          <div className="mt-3 aspect-square w-full rounded-lg bg-gray-100 flex items-center justify-center">
            <span className="text-xs text-gray-400">Image preview</span>
          </div>
        )}

        {/* Engagement bar */}
        <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-2">
          <span className="text-xs text-gray-400">
            {platform === "linkedin" ? "Like" : platform === "twitter" ? "Reply" : "Like"}
          </span>
          <span className="text-xs text-gray-400">
            {platform === "twitter" ? "Repost" : "Comment"}
          </span>
          <span className="text-xs text-gray-400">Share</span>
        </div>
      </div>

      {/* Character count */}
      <div className="mt-2 flex justify-end">
        <span
          className={cn(
            "text-xs",
            exceeded ? "text-red-500 font-medium" : "text-gray-400",
          )}
        >
          {charCount.toLocaleString()} / {limit.toLocaleString()} characters
        </span>
      </div>
    </div>
  );
}
