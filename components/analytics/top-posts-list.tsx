/**
 * TopPostsList -- Ranked list of the top 5 posts by total engagement.
 *
 * Each item shows rank, content preview, platform badges, total engagement,
 * impressions, and a sparkline mini-chart. Clicking a row navigates to the
 * post detail view.
 */

"use client";

import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  TrendingUp,
} from "lucide-react";
import { PlatformBadge } from "@/components/ui/platform-badge";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TopPost {
  /** Post ID (used for navigation). */
  id: string;
  /** Post content text (may be truncated). */
  content: string;
  /** Platforms the post was published to. */
  platforms: string[];
  /** Total engagement (likes + comments + shares). */
  totalEngagement: number;
  /** Total impressions. */
  impressions: number;
  /** Total likes. */
  likes: number;
  /** Total comments. */
  comments: number;
  /** Total shares. */
  shares: number;
  /** Sparkline data points for engagement over recent days. */
  sparkline: number[];
}

interface TopPostsListProps {
  posts: TopPost[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function truncate(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

// ─── Sparkline component ─────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="#4f46e5"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TopPostsList({ posts }: TopPostsListProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Top Performing Posts
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Your top 5 posts ranked by total engagement
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            No published posts with engagement data yet.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {posts.map((post, index) => (
            <li key={post.id}>
              <button
                type="button"
                className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-50 sm:gap-4 sm:px-6"
                onClick={() => {
                  // TODO: Navigate to post details when routing is connected
                  // router.push(`/dashboard/posts/${post.id}`)
                }}
              >
                {/* Rank number */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600 sm:h-8 sm:w-8 sm:text-sm">
                  {index + 1}
                </div>

                {/* Post info */}
                <div className="min-w-0 flex-1">
                  {/* Content preview */}
                  <p className="text-sm leading-relaxed text-gray-800">
                    {truncate(post.content)}
                  </p>

                  {/* Platform badges */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {post.platforms.map((platform) => (
                      <PlatformBadge key={platform} platform={platform} />
                    ))}
                  </div>

                  {/* Total engagement (mobile-only, since sparkline is hidden) */}
                  <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-gray-900 sm:hidden">
                    <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                    {formatNumber(post.totalEngagement)} total engagement
                  </div>

                  {/* Engagement metrics row */}
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {formatNumber(post.impressions)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {formatNumber(post.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {formatNumber(post.comments)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-3.5 w-3.5" />
                      {formatNumber(post.shares)}
                    </span>
                  </div>
                </div>

                {/* Sparkline + total */}
                <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                  <Sparkline data={post.sparkline} />
                  <span className="text-sm font-semibold tabular-nums text-gray-900">
                    {formatNumber(post.totalEngagement)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-gray-400">
                    total engagement
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
