/**
 * aggregation.ts — Analytics aggregation utilities.
 *
 * Provides helper functions for combining multi-platform metrics,
 * calculating engagement rates and growth, and grouping time-series
 * data by day, week, or month.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PlatformMetrics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
}

export interface AggregatedMetrics extends PlatformMetrics {
  totalEngagements: number;
  engagementRate: number;
  platformCount: number;
}

export interface TimeSeriesDataPoint {
  date: number; // Unix timestamp in milliseconds
  value: number;
  [key: string]: unknown;
}

export interface GroupedDataPoint {
  periodStart: number;
  periodEnd: number;
  periodLabel: string;
  values: TimeSeriesDataPoint[];
  aggregatedValue: number;
}

// ─── Aggregation Functions ──────────────────────────────────────────────────

/**
 * Combines metrics from multiple platforms into a single aggregated summary.
 *
 * Sums all numeric engagement metrics across platforms and computes
 * a combined engagement rate based on total impressions.
 */
export function aggregatePostMetrics(
  platformMetrics: PlatformMetrics[],
): AggregatedMetrics {
  if (platformMetrics.length === 0) {
    return {
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clicks: 0,
      totalEngagements: 0,
      engagementRate: 0,
      platformCount: 0,
    };
  }

  const totals = platformMetrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      reach: acc.reach + m.reach,
      likes: acc.likes + m.likes,
      comments: acc.comments + m.comments,
      shares: acc.shares + m.shares,
      saves: acc.saves + m.saves,
      clicks: acc.clicks + m.clicks,
    }),
    {
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clicks: 0,
    },
  );

  const totalEngagements =
    totals.likes +
    totals.comments +
    totals.shares +
    totals.saves +
    totals.clicks;

  const engagementRate = calculateEngagementRate(
    totals.impressions,
    totalEngagements,
  );

  return {
    ...totals,
    totalEngagements,
    engagementRate,
    platformCount: platformMetrics.length,
  };
}

/**
 * Calculates engagement rate as a percentage.
 *
 * Formula: (totalEngagements / impressions) * 100
 * Returns 0 when there are no impressions to avoid division by zero.
 */
export function calculateEngagementRate(
  impressions: number,
  totalEngagements: number,
): number {
  if (impressions <= 0) return 0;
  return (totalEngagements / impressions) * 100;
}

/**
 * Calculates percentage growth rate between two values.
 *
 * Formula: ((current - previous) / previous) * 100
 * Returns 0 when the previous value is 0 to avoid division by zero.
 * A positive result indicates growth; negative indicates decline.
 */
export function calculateGrowthRate(
  current: number,
  previous: number,
): number {
  if (previous === 0) {
    // If previous is 0 and current is also 0, there is no growth.
    // If previous is 0 and current > 0, growth is effectively infinite;
    // we return 100 as a meaningful upper-bound indicator.
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Groups an array of time-series data points by the specified period.
 *
 * Each group contains the constituent data points and a summed
 * `aggregatedValue` for the period. The `periodLabel` uses a
 * human-readable date format (YYYY-MM-DD for day, YYYY-Www for week,
 * YYYY-MM for month).
 */
export function groupByTimePeriod(
  dataPoints: TimeSeriesDataPoint[],
  period: "day" | "week" | "month",
): GroupedDataPoint[] {
  if (dataPoints.length === 0) return [];

  // Sort data points by date ascending
  const sorted = [...dataPoints].sort((a, b) => a.date - b.date);

  const groups = new Map<string, GroupedDataPoint>();

  for (const point of sorted) {
    const d = new Date(point.date);
    const { key, start, end, label } = getPeriodBounds(d, period);

    if (!groups.has(key)) {
      groups.set(key, {
        periodStart: start,
        periodEnd: end,
        periodLabel: label,
        values: [],
        aggregatedValue: 0,
      });
    }

    const group = groups.get(key)!;
    group.values.push(point);
    group.aggregatedValue += point.value;
  }

  // Return groups sorted by periodStart
  return Array.from(groups.values()).sort(
    (a, b) => a.periodStart - b.periodStart,
  );
}

// ─── Internal helpers ───────────────────────────────────────────────────────

/**
 * Returns the grouping key, start timestamp, end timestamp, and label
 * for the period containing the given date.
 */
function getPeriodBounds(
  date: Date,
  period: "day" | "week" | "month",
): { key: string; start: number; end: number; label: string } {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  switch (period) {
    case "day": {
      const start = Date.UTC(year, month, day);
      const end = Date.UTC(year, month, day + 1) - 1;
      const label = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { key: label, start, end, label };
    }

    case "week": {
      // ISO week: Monday-based week numbering
      const dayOfWeek = date.getUTCDay(); // 0 = Sunday
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(Date.UTC(year, month, day + mondayOffset));
      const sunday = new Date(
        Date.UTC(
          monday.getUTCFullYear(),
          monday.getUTCMonth(),
          monday.getUTCDate() + 7,
        ) - 1,
      );
      const weekNum = getISOWeekNumber(monday);
      const weekYear = monday.getUTCFullYear();
      const label = `${weekYear}-W${String(weekNum).padStart(2, "0")}`;
      return {
        key: label,
        start: monday.getTime(),
        end: sunday.getTime(),
        label,
      };
    }

    case "month": {
      const start = Date.UTC(year, month, 1);
      const end = Date.UTC(year, month + 1, 1) - 1;
      const label = `${year}-${String(month + 1).padStart(2, "0")}`;
      return { key: label, start, end, label };
    }
  }
}

/**
 * Returns the ISO 8601 week number for a given date.
 */
function getISOWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  // Set to nearest Thursday: current date + 4 - day number (Monday = 1)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
