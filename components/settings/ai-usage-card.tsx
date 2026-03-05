/**
 * AIUsageCard — AI credit usage tracking display.
 *
 * Shows the current month's AI credit usage with a visual progress bar,
 * breakdown by action type (captions, rewrites, hashtags), and reset date.
 * Adapts display for Business tier (unlimited credits).
 */

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  BarChart3,
  MessageSquare,
  RefreshCw,
  Hash,
  ArrowUpCircle,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Component ───────────────────────────────────────────────────────────────

interface AIUsageCardProps {
  /** When true, shows a compact version suitable for the Profile tab. */
  compact?: boolean;
  /** Callback to switch to the subscription tab for upgrades. */
  onUpgradeClick?: () => void;
}

export function AIUsageCard({ compact, onUpgradeClick }: AIUsageCardProps) {
  const usageSummary = useQuery(api.aiUsage.getUsageSummary);

  // ── Loading state ────────────────────────────────────────────────────────

  if (usageSummary === undefined) {
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

  if (usageSummary === null) {
    return null;
  }

  const {
    totalUsed,
    limit,
    isUnlimited,
    breakdown,
    resetDate,
    tier,
  } = usageSummary;

  const usagePercent = isUnlimited
    ? 0
    : limit > 0
      ? Math.min((totalUsed / limit) * 100, 100)
      : 0;

  const resetDateFormatted = new Date(resetDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Determine bar color based on usage percentage
  const barColor =
    usagePercent > 90
      ? "bg-red-500"
      : usagePercent > 75
        ? "bg-amber-500"
        : "bg-indigo-600";

  // ── Compact mode (for Profile tab) ───────────────────────────────────────

  if (compact) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          AI Credits Usage
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Your monthly AI generation credit usage.
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {isUnlimited ? (
                <>{totalUsed} credits used</>
              ) : (
                <>
                  {totalUsed} / {limit} credits used
                </>
              )}
            </span>
            {isUnlimited ? (
              <span className="font-medium text-purple-700">Unlimited</span>
            ) : (
              <span className="font-medium text-gray-900">
                {Math.round(usagePercent)}%
              </span>
            )}
          </div>
          {!isUnlimited && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
          {isUnlimited && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-purple-100">
              <div className="h-full w-full rounded-full bg-purple-400" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Full mode (for AI Settings tab) ──────────────────────────────────────

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          AI Usage This Month
        </h2>
      </div>

      {/* Main usage display */}
      <div className="mt-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold tracking-tight text-gray-900">
              {totalUsed}
            </span>
            {!isUnlimited && (
              <span className="ml-1 text-lg text-gray-400">/ {limit}</span>
            )}
            <p className="mt-0.5 text-sm text-gray-500">
              {isUnlimited ? "credits used (Unlimited)" : "AI credits used"}
            </p>
          </div>
          {!isUnlimited && (
            <span
              className={cn(
                "text-2xl font-bold",
                usagePercent > 90
                  ? "text-red-600"
                  : usagePercent > 75
                    ? "text-amber-600"
                    : "text-gray-400",
              )}
            >
              {Math.round(usagePercent)}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        {!isUnlimited && (
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                barColor,
              )}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        )}
        {isUnlimited && (
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-purple-100">
            <div className="h-full w-full rounded-full bg-purple-400" />
          </div>
        )}
      </div>

      {/* Breakdown by type */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-xs font-medium text-gray-500">
              Captions
            </span>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {breakdown.generate}
          </p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
          <div className="flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-gray-500">
              Rewrites
            </span>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {breakdown.rewrite}
          </p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-medium text-gray-500">
              Hashtags
            </span>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {breakdown.hashtags}
          </p>
        </div>
      </div>

      {/* Reset date */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <CalendarClock className="h-3.5 w-3.5" />
        <span>Resets on {resetDateFormatted}</span>
      </div>

      {/* Upgrade CTA when approaching limit */}
      {!isUnlimited && usagePercent >= 75 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <ArrowUpCircle className="h-4 w-4 shrink-0" />
              <span>
                {usagePercent >= 100
                  ? "You've used all your AI credits this month."
                  : "You're approaching your credit limit."}
              </span>
            </div>
            {onUpgradeClick && tier !== "business" && (
              <button
                onClick={onUpgradeClick}
                className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
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
