/**
 * StatsCard -- Summary metric card with large number, trend arrow, and
 * percentage change versus the previous period.
 *
 * Green for positive change, red for negative, gray for neutral.
 */

"use client";

import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatsCardProps {
  /** Label shown above the metric (e.g. "Total Impressions"). */
  title: string;
  /** Formatted display value (e.g. "24.5K"). */
  value: string;
  /** Percentage change vs previous period. */
  change: number;
  /** Direction of the change. */
  changeDirection: "up" | "down" | "neutral";
  /** Lucide icon component rendered in the card header. */
  icon: LucideIcon;
}

export function StatsCard({
  title,
  value,
  change,
  changeDirection,
  icon: Icon,
}: StatsCardProps) {
  const trendConfig = {
    up: {
      icon: TrendingUp,
      text: "text-green-600",
      bg: "bg-green-50",
    },
    down: {
      icon: TrendingDown,
      text: "text-red-600",
      bg: "bg-red-50",
    },
    neutral: {
      icon: Minus,
      text: "text-gray-500",
      bg: "bg-gray-50",
    },
  };

  const trend = trendConfig[changeDirection];
  const TrendIcon = trend.icon;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-6 shadow-sm">
      {/* Header row: title + icon */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <Icon className="h-4 w-4 text-indigo-600" />
        </div>
      </div>

      {/* Value */}
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
        {value}
      </p>

      {/* Trend badge */}
      <div className="mt-2 flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            trend.bg,
            trend.text,
          )}
        >
          <TrendIcon className="h-3 w-3" />
          {changeDirection === "neutral"
            ? "0%"
            : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`}
        </span>
        <span className="text-xs text-gray-400">vs previous period</span>
      </div>
    </div>
  );
}
