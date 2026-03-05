/**
 * EngagementChart -- Main area chart showing impressions, reach, and
 * engagement over time using Recharts.
 *
 * Renders inside a ResponsiveContainer with a custom tooltip and legend.
 */

"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface EngagementDataPoint {
  /** Display label for the X axis (e.g. "Jan 15", "Week 3"). */
  date: string;
  /** Impressions count. */
  impressions: number;
  /** Reach count. */
  reach: number;
  /** Total engagement (likes + comments + shares). */
  engagement: number;
}

interface EngagementChartProps {
  data: EngagementDataPoint[];
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

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

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold text-gray-500">{label}</p>
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

export function EngagementChart({ data }: EngagementChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Engagement Over Time
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Impressions, reach, and engagement trends
      </p>

      <div className="-mx-2 mt-6 h-64 sm:mx-0 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradImpressions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradReach" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradEngagement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatNumber}
              width={48}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingTop: 16, fontSize: 13 }}
            />

            <Area
              type="monotone"
              dataKey="impressions"
              stroke="#4f46e5"
              strokeWidth={2}
              fill="url(#gradImpressions)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="reach"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#gradReach)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="engagement"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradEngagement)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
