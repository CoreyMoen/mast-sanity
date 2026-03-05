/**
 * Analytics Page -- Full analytics dashboard with summary stats, engagement
 * charts, platform breakdown, and top-performing posts.
 *
 * Gated behind Pro/Business tier using the UpgradeGate component.
 * All data fetched from Convex analytics queries in real time.
 */

"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  BarChart3,
  Eye,
  Users,
  Heart,
  TrendingUp,
  FileText,
  Clock,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { UpgradeGate } from "@/components/ui/upgrade-gate";
import { StatsCard } from "@/components/analytics/stats-card";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/utils/validation";
import type { TopPost } from "@/components/analytics/top-posts-list";

const EngagementChart = dynamic(() => import("@/components/analytics/engagement-chart").then(mod => ({ default: mod.EngagementChart })), { ssr: false });
const PlatformBreakdown = dynamic(() => import("@/components/analytics/platform-breakdown").then(mod => ({ default: mod.PlatformBreakdown })), { ssr: false });
const EngagementHeatmap = dynamic(() => import("@/components/analytics/engagement-heatmap").then(mod => ({ default: mod.EngagementHeatmap })), { ssr: false });
const TopPostsList = dynamic(() => import("@/components/analytics/top-posts-list").then(mod => ({ default: mod.TopPostsList })), { ssr: false });

// ─── Date range options ──────────────────────────────────────────────────────

type DateRange = "7d" | "30d" | "90d" | "custom";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "custom", label: "Custom" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateRangeToDays(range: DateRange, customStart: string, customEnd: string): number {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  // Custom range: compute days between customStart and customEnd
  const start = new Date(customStart).getTime();
  const end = new Date(customEnd).getTime();
  const diffMs = end - start;
  return diffMs > 0 ? Math.ceil(diffMs / (24 * 60 * 60 * 1000)) : 30;
}

function dateRangeToTimestamps(range: DateRange, customStart: string, customEnd: string): { startDate: number; endDate: number } {
  const now = Date.now();
  if (range === "custom") {
    return {
      startDate: new Date(customStart).getTime(),
      endDate: new Date(customEnd).getTime() + 24 * 60 * 60 * 1000 - 1, // End of day
    };
  }
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return {
    startDate: now - days * 24 * 60 * 60 * 1000,
    endDate: now,
  };
}

function changeDirection(value: number): "up" | "down" | "neutral" {
  if (value > 0.5) return "up";
  if (value < -0.5) return "down";
  return "neutral";
}

function formatLargeNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ─── Custom date picker (simple) ─────────────────────────────────────────────

function CustomDatePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: {
  startDate: string;
  endDate: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:min-h-0 sm:w-auto"
      />
      <span className="hidden text-sm text-gray-400 sm:block">to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:min-h-0 sm:w-auto"
      />
    </div>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white px-5 py-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100" />
            </div>
            <div className="mt-3 h-9 w-20 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-5 w-32 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-100" />
        <div className="mt-6 h-80 animate-pulse rounded-lg bg-gray-50" />
      </div>

      {/* Platform breakdown skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 h-72 animate-pulse rounded-lg bg-gray-50" />
      </div>
    </div>
  );
}

// ─── Page component ──────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [customEnd, setCustomEnd] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  // Compute query arguments from the selected date range
  const days = useMemo(
    () => dateRangeToDays(dateRange, customStart, customEnd),
    [dateRange, customStart, customEnd],
  );
  const { startDate, endDate } = useMemo(
    () => dateRangeToTimestamps(dateRange, customStart, customEnd),
    [dateRange, customStart, customEnd],
  );

  // ─── Convex queries ──────────────────────────────────────────────────────

  // Get user's subscription tier
  const postLimit = useQuery(api.featureGates.checkPostLimit);
  const tier: SubscriptionTier = (postLimit?.tier as SubscriptionTier) ?? "free";

  // Dashboard stats (total impressions, reach, engagement, trends)
  const dashboardStats = useQuery(api.analytics.getDashboardStats);

  // Engagement time-series for the chart
  const engagementData = useQuery(api.analytics.getEngagementTimeSeries, {
    days,
  });

  // Platform breakdown
  const platformData = useQuery(api.analytics.getPlatformBreakdown);

  // Engagement heatmap (best times to post)
  const heatmapData = useQuery(api.analytics.getEngagementHeatmap);

  // Top performing posts
  const topPostsRaw = useQuery(api.analytics.getTopPosts, {
    limit: 5,
    startDate,
    endDate,
  });

  // ─── Derived state ───────────────────────────────────────────────────────

  // null = auth not yet synced, undefined = query still loading
  const isLoading =
    postLimit === undefined || postLimit === null ||
    dashboardStats === undefined || dashboardStats === null ||
    engagementData === undefined || engagementData === null ||
    platformData === undefined || platformData === null ||
    topPostsRaw === undefined || topPostsRaw === null;

  // Map Convex top posts to the TopPost shape expected by TopPostsList
  const topPosts: TopPost[] = useMemo(() => {
    if (!topPostsRaw) return [];
    return topPostsRaw.map((p) => ({
      id: p.postId,
      content: p.content,
      platforms: p.platforms,
      totalEngagement: p.totalEngagements,
      impressions: p.impressions,
      likes: p.likes,
      comments: p.comments,
      shares: p.shares,
      // Generate a flat sparkline from the single data point since
      // per-day historical data is not stored per post. The sparkline
      // will show a steady line representing the total engagement.
      sparkline: [
        p.totalEngagements,
        p.totalEngagements,
        p.totalEngagements,
        p.totalEngagements,
        p.totalEngagements,
        p.totalEngagements,
        p.totalEngagements,
      ],
    }));
  }, [topPostsRaw]);

  // Determine if there is any analytics data to show
  const hasNoData =
    !isLoading &&
    dashboardStats !== undefined &&
    dashboardStats.totalPosts === 0;

  // Compute summary stat change directions from dashboard stats
  const impressionsChange = dashboardStats?.engagementRateTrend ?? 0;
  const engagementRateChange = dashboardStats?.engagementRateTrend ?? 0;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Analytics
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Track your social media performance across all platforms.
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="inline-flex w-full overflow-x-auto rounded-lg border border-gray-200 bg-white p-1 shadow-sm sm:w-auto">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDateRange(opt.value)}
                className={`min-h-[44px] whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:min-h-[36px] ${
                  dateRange === opt.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom date picker */}
          {dateRange === "custom" && (
            <CustomDatePicker
              startDate={customStart}
              endDate={customEnd}
              onStartChange={setCustomStart}
              onEndChange={setCustomEnd}
            />
          )}
        </div>
      </div>

      {/* Data retention info */}
      {!isLoading && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          <span>
            Data retained for {TIER_LIMITS[tier].analyticsRetentionDays === 365 ? "1 year" : `${TIER_LIMITS[tier].analyticsRetentionDays} days`} on {tier} plan
          </span>
        </div>
      )}

      {/* Gated content */}
      <div className="mt-8">
        {isLoading ? (
          <AnalyticsSkeleton />
        ) : hasNoData ? (
          <EmptyState
            icon={BarChart3}
            title="No analytics data yet"
            description="Publish your first post to start tracking impressions, engagement, and reach across your social platforms."
            actionLabel="Create a Post"
            actionHref="/dashboard/posts/new"
          />
        ) : (
          <UpgradeGate feature="analytics" tier={tier}>
            <div className="space-y-8 pb-12">
              {/* Summary stats row */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                  title="Total Impressions"
                  value={formatLargeNumber(dashboardStats.totalImpressions)}
                  change={impressionsChange}
                  changeDirection={changeDirection(impressionsChange)}
                  icon={Eye}
                />
                <StatsCard
                  title="Total Reach"
                  value={formatLargeNumber(dashboardStats.totalReach)}
                  change={0}
                  changeDirection="neutral"
                  icon={Users}
                />
                <StatsCard
                  title="Total Engagement"
                  value={formatLargeNumber(dashboardStats.totalEngagements)}
                  change={engagementRateChange}
                  changeDirection={changeDirection(engagementRateChange)}
                  icon={Heart}
                />
                <StatsCard
                  title="Engagement Rate"
                  value={`${dashboardStats.overallEngagementRate.toFixed(2)}%`}
                  change={dashboardStats.engagementRateTrend}
                  changeDirection={changeDirection(
                    dashboardStats.engagementRateTrend,
                  )}
                  icon={TrendingUp}
                />
                <StatsCard
                  title="Total Posts"
                  value={formatLargeNumber(dashboardStats.totalPosts)}
                  change={0}
                  changeDirection="neutral"
                  icon={FileText}
                />
                <StatsCard
                  title="Total Followers"
                  value={formatLargeNumber(dashboardStats.totalFollowers)}
                  change={0}
                  changeDirection="neutral"
                  icon={Users}
                />
              </div>

              {/* Main engagement chart */}
              <EngagementChart data={engagementData} />

              {/* Platform breakdown */}
              <PlatformBreakdown data={platformData} />

              {/* Engagement heatmap — best times to post */}
              {heatmapData && (
                <EngagementHeatmap data={heatmapData} />
              )}

              {/* Top posts */}
              <TopPostsList posts={topPosts} />
            </div>
          </UpgradeGate>
        )}
      </div>
    </div>
  );
}
