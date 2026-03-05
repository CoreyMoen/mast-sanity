"use strict";
/**
 * aggregation.ts — Analytics aggregation utilities.
 *
 * Provides helper functions for combining multi-platform metrics,
 * calculating engagement rates and growth, and grouping time-series
 * data by day, week, or month.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregatePostMetrics = aggregatePostMetrics;
exports.calculateEngagementRate = calculateEngagementRate;
exports.calculateGrowthRate = calculateGrowthRate;
exports.groupByTimePeriod = groupByTimePeriod;
// ─── Aggregation Functions ──────────────────────────────────────────────────
/**
 * Combines metrics from multiple platforms into a single aggregated summary.
 *
 * Sums all numeric engagement metrics across platforms and computes
 * a combined engagement rate based on total impressions.
 */
function aggregatePostMetrics(platformMetrics) {
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
    var totals = platformMetrics.reduce(function (acc, m) { return ({
        impressions: acc.impressions + m.impressions,
        reach: acc.reach + m.reach,
        likes: acc.likes + m.likes,
        comments: acc.comments + m.comments,
        shares: acc.shares + m.shares,
        saves: acc.saves + m.saves,
        clicks: acc.clicks + m.clicks,
    }); }, {
        impressions: 0,
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        clicks: 0,
    });
    var totalEngagements = totals.likes +
        totals.comments +
        totals.shares +
        totals.saves +
        totals.clicks;
    var engagementRate = calculateEngagementRate(totals.impressions, totalEngagements);
    return __assign(__assign({}, totals), { totalEngagements: totalEngagements, engagementRate: engagementRate, platformCount: platformMetrics.length });
}
/**
 * Calculates engagement rate as a percentage.
 *
 * Formula: (totalEngagements / impressions) * 100
 * Returns 0 when there are no impressions to avoid division by zero.
 */
function calculateEngagementRate(impressions, totalEngagements) {
    if (impressions <= 0)
        return 0;
    return (totalEngagements / impressions) * 100;
}
/**
 * Calculates percentage growth rate between two values.
 *
 * Formula: ((current - previous) / previous) * 100
 * Returns 0 when the previous value is 0 to avoid division by zero.
 * A positive result indicates growth; negative indicates decline.
 */
function calculateGrowthRate(current, previous) {
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
function groupByTimePeriod(dataPoints, period) {
    if (dataPoints.length === 0)
        return [];
    // Sort data points by date ascending
    var sorted = __spreadArray([], dataPoints, true).sort(function (a, b) { return a.date - b.date; });
    var groups = new Map();
    for (var _i = 0, sorted_1 = sorted; _i < sorted_1.length; _i++) {
        var point = sorted_1[_i];
        var d = new Date(point.date);
        var _a = getPeriodBounds(d, period), key = _a.key, start = _a.start, end = _a.end, label = _a.label;
        if (!groups.has(key)) {
            groups.set(key, {
                periodStart: start,
                periodEnd: end,
                periodLabel: label,
                values: [],
                aggregatedValue: 0,
            });
        }
        var group = groups.get(key);
        group.values.push(point);
        group.aggregatedValue += point.value;
    }
    // Return groups sorted by periodStart
    return Array.from(groups.values()).sort(function (a, b) { return a.periodStart - b.periodStart; });
}
// ─── Internal helpers ───────────────────────────────────────────────────────
/**
 * Returns the grouping key, start timestamp, end timestamp, and label
 * for the period containing the given date.
 */
function getPeriodBounds(date, period) {
    var year = date.getUTCFullYear();
    var month = date.getUTCMonth();
    var day = date.getUTCDate();
    switch (period) {
        case "day": {
            var start = Date.UTC(year, month, day);
            var end = Date.UTC(year, month, day + 1) - 1;
            var label = "".concat(year, "-").concat(String(month + 1).padStart(2, "0"), "-").concat(String(day).padStart(2, "0"));
            return { key: label, start: start, end: end, label: label };
        }
        case "week": {
            // ISO week: Monday-based week numbering
            var dayOfWeek = date.getUTCDay(); // 0 = Sunday
            var mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            var monday = new Date(Date.UTC(year, month, day + mondayOffset));
            var sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 7) - 1);
            var weekNum = getISOWeekNumber(monday);
            var weekYear = monday.getUTCFullYear();
            var label = "".concat(weekYear, "-W").concat(String(weekNum).padStart(2, "0"));
            return {
                key: label,
                start: monday.getTime(),
                end: sunday.getTime(),
                label: label,
            };
        }
        case "month": {
            var start = Date.UTC(year, month, 1);
            var end = Date.UTC(year, month + 1, 1) - 1;
            var label = "".concat(year, "-").concat(String(month + 1).padStart(2, "0"));
            return { key: label, start: start, end: end, label: label };
        }
    }
}
/**
 * Returns the ISO 8601 week number for a given date.
 */
function getISOWeekNumber(date) {
    var d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    // Set to nearest Thursday: current date + 4 - day number (Monday = 1)
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
