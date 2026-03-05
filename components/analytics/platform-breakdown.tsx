/**
 * PlatformBreakdown -- Horizontal bar chart comparing engagement metrics
 * across social platforms (Instagram, Facebook, Twitter/X, LinkedIn).
 *
 * Color-coded per platform with grouped bars for impressions, likes,
 * comments, and shares.
 */

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ─── Platform colors ─────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  twitter: "#000000",
  linkedin: "#0A66C2",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlatformMetrics {
  platform: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
}

interface PlatformBreakdownProps {
  data: PlatformMetrics[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; color?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const platformLabel = PLATFORM_LABELS[label ?? ""] ?? label;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold text-gray-500">
        {platformLabel}
      </p>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className="flex items-center justify-between gap-6 text-sm"
        >
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="capitalize text-gray-600">
              {entry.dataKey}
            </span>
          </span>
          <span className="font-semibold tabular-nums text-gray-900">
            {formatNumber(entry.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Chart ───────────────────────────────────────────────────────────────────

export function PlatformBreakdown({ data }: PlatformBreakdownProps) {
  // Transform data to use platform labels for display
  const chartData = data.map((d) => ({
    ...d,
    name: PLATFORM_LABELS[d.platform] ?? d.platform,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Platform Breakdown
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Engagement metrics compared across platforms
      </p>

      <div className="-mx-2 mt-6 h-64 overflow-x-auto sm:mx-0 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f3f4f6"
              horizontal={false}
            />

            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={formatNumber}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              width={100}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingTop: 12, fontSize: 13 }}
            />

            <Bar
              dataKey="impressions"
              fill="#4f46e5"
              radius={[0, 4, 4, 0]}
              barSize={10}
            />
            <Bar
              dataKey="likes"
              fill="#ef4444"
              radius={[0, 4, 4, 0]}
              barSize={10}
            />
            <Bar
              dataKey="comments"
              fill="#f59e0b"
              radius={[0, 4, 4, 0]}
              barSize={10}
            />
            <Bar
              dataKey="shares"
              fill="#10b981"
              radius={[0, 4, 4, 0]}
              barSize={10}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Platform color legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4">
        {data.map((d) => (
          <div key={d.platform} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{
                backgroundColor:
                  PLATFORM_COLORS[d.platform] ?? "#6b7280",
              }}
            />
            <span className="font-medium text-gray-600">
              {PLATFORM_LABELS[d.platform] ?? d.platform}
            </span>
            <span className="tabular-nums text-gray-400">
              {formatNumber(
                d.impressions + d.likes + d.comments + d.shares,
              )}{" "}
              total
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
