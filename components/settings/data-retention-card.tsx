/**
 * DataRetentionCard — Displays the user's data retention policy and cleanup preview.
 *
 * Shows the current retention window based on subscription tier, a comparison
 * table across all tiers, estimated data that would be cleaned up, and an
 * upgrade CTA for users on limited tiers.
 */

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Database,
  Trash2,
  Crown,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Activity,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tier retention comparison data ─────────────────────────────────────────

const TIER_RETENTION = [
  { tier: "Free", days: 7, label: "7 days", color: "text-gray-600" },
  { tier: "Pro", days: 90, label: "90 days", color: "text-indigo-600" },
  { tier: "Business", days: 365, label: "365 days", color: "text-purple-600" },
] as const;

// ─── Component ──────────────────────────────────────────────────────────────

interface DataRetentionCardProps {
  /** Callback to navigate to the subscription tab for upgrades. */
  onUpgradeClick?: () => void;
}

export function DataRetentionCard({ onUpgradeClick }: DataRetentionCardProps) {
  const retentionPolicy = useQuery(api.dataRetention.getRetentionPolicy);
  const [showPreview, setShowPreview] = useState(false);
  const cleanupPreview = useQuery(
    api.dataRetention.previewCleanup,
    showPreview ? {} : "skip",
  );

  // ── Loading state ─────────────────────────────────────────────────────────

  if (retentionPolicy === undefined || retentionPolicy === null) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="space-y-4">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-64 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  const {
    tier,
    retentionDays,
    totalPostAnalytics,
    totalAccountAnalytics,
    totalAiLogs,
    expiredPostAnalytics,
    expiredAccountAnalytics,
    expiredAiLogs,
  } = retentionPolicy;

  const isMaxTier = tier === "business";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          Data Retention Policy
        </h2>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Analytics and AI usage data are retained based on your subscription
        tier. Older data is automatically cleaned up daily.
      </p>

      {/* Current retention info */}
      <div className="mt-5 flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <Clock className="h-8 w-8 shrink-0 text-indigo-600" />
        <div>
          <p className="text-sm font-medium text-gray-900">
            Your data is kept for{" "}
            <span className="font-bold text-indigo-600">
              {retentionDays} days
            </span>
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Based on your{" "}
            <span className="font-medium capitalize">{tier}</span> plan.
            Records older than {retentionDays} days are removed during the
            daily cleanup.
          </p>
        </div>
      </div>

      {/* Data summary */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-xs font-medium text-gray-500">
              Post Analytics
            </span>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {totalPostAnalytics}
          </p>
          {expiredPostAnalytics > 0 && (
            <p className="text-xs text-amber-600">
              {expiredPostAnalytics} expired
            </p>
          )}
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-medium text-gray-500">
              Account Analytics
            </span>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {totalAccountAnalytics}
          </p>
          {expiredAccountAnalytics > 0 && (
            <p className="text-xs text-amber-600">
              {expiredAccountAnalytics} expired
            </p>
          )}
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
          <div className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-xs font-medium text-gray-500">
              AI Usage Logs
            </span>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {totalAiLogs}
          </p>
          {expiredAiLogs > 0 && (
            <p className="text-xs text-amber-600">
              {expiredAiLogs} expired
            </p>
          )}
        </div>
      </div>

      {/* Tier comparison table */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900">
          Retention by Plan
        </h3>
        <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left font-medium text-gray-600">
                  Plan
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">
                  Retention
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {TIER_RETENTION.map((t) => {
                const isCurrent = t.tier.toLowerCase() === tier;
                return (
                  <tr
                    key={t.tier}
                    className={cn(isCurrent && "bg-indigo-50/50")}
                  >
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "font-medium",
                          isCurrent ? "text-indigo-700" : "text-gray-900",
                        )}
                      >
                        {t.tier}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("font-semibold", t.color)}>
                        {t.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                          <ShieldCheck className="h-3 w-3" />
                          Current
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview cleanup button */}
      <div className="mt-5">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Trash2 className="h-4 w-4" />
          Preview Cleanup
          {showPreview ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showPreview && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            {cleanupPreview === undefined || cleanupPreview === null ? (
              <div className="space-y-2">
                <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900">
                  Records that would be removed
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Data older than {cleanupPreview.retentionDays} days (before{" "}
                  {new Date(cleanupPreview.cutoffDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                  )
                </p>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Post Analytics</span>
                    <span className="font-medium text-gray-900">
                      {cleanupPreview.postAnalyticsCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Account Analytics</span>
                    <span className="font-medium text-gray-900">
                      {cleanupPreview.accountAnalyticsCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">AI Usage Logs</span>
                    <span className="font-medium text-gray-900">
                      {cleanupPreview.aiUsageLogCount}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span
                        className={cn(
                          cleanupPreview.totalCount > 0
                            ? "text-amber-600"
                            : "text-green-600",
                        )}
                      >
                        {cleanupPreview.totalCount > 0
                          ? `${cleanupPreview.totalCount} records`
                          : "No records to clean up"}
                      </span>
                    </div>
                  </div>
                </div>

                {cleanupPreview.totalCount === 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-green-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    All your data is within the retention window.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Upgrade CTA for non-business tiers */}
      {!isMaxTier && (
        <div className="mt-5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-indigo-800">
              <Crown className="h-4 w-4 shrink-0" />
              <span>
                {tier === "free"
                  ? "Upgrade to Pro for 90-day retention, or Business for 365 days."
                  : "Upgrade to Business for 365-day retention."}
              </span>
            </div>
            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
