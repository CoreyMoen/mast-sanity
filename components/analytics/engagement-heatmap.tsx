"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface HeatmapData {
  day: number; // 0=Sun to 6=Sat
  hour: number; // 0-23
  engagement: number;
}

interface EngagementHeatmapProps {
  data: HeatmapData[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** Format an hour number (0-23) as a 12-hour label. */
function formatHour(h: number): string {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

/** Map a ratio (0-1) to a Tailwind color class. */
function intensityClass(ratio: number): string {
  if (ratio <= 0) return "bg-gray-50";
  if (ratio <= 0.25) return "bg-indigo-100";
  if (ratio <= 0.5) return "bg-indigo-200";
  if (ratio <= 0.75) return "bg-indigo-400";
  return "bg-indigo-600";
}

export function EngagementHeatmap({ data }: EngagementHeatmapProps) {
  // Build a 7x24 lookup grid and find max engagement for color scaling
  const { grid, maxEngagement } = useMemo(() => {
    const g = new Map<string, number>();
    let max = 0;
    for (const entry of data) {
      const key = `${entry.day}-${entry.hour}`;
      const val = (g.get(key) ?? 0) + entry.engagement;
      g.set(key, val);
      if (val > max) max = val;
    }
    return { grid: g, maxEngagement: max };
  }, [data]);

  // Empty state
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold text-gray-900">
          Best Times to Post
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Based on historical engagement data
        </p>
        <div className="mt-10 flex items-center justify-center pb-10">
          <p className="text-sm text-gray-400">No published posts yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900">
        Best Times to Post
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Based on historical engagement data
      </p>

      {/* Heatmap grid */}
      <div className="mt-6 overflow-x-auto">
        <div className="inline-block">
          {/* Hour labels (top axis) — show every 3 hours */}
          <div className="flex">
            {/* Spacer for the day label column */}
            <div className="w-10 shrink-0" />
            <div className="flex gap-0.5">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="flex h-5 w-7 items-end justify-center sm:w-8"
                >
                  {h % 3 === 0 && (
                    <span className="text-[10px] leading-none text-gray-400">
                      {formatHour(h)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rows — one per day */}
          {DAYS.map((dayLabel, dayIdx) => (
            <div key={dayLabel} className="flex items-center">
              {/* Day label (left axis) */}
              <div className="w-10 shrink-0 pr-2 text-right text-xs text-gray-500">
                {dayLabel}
              </div>

              {/* Cells for each hour */}
              <div className="flex gap-0.5">
                {HOURS.map((h) => {
                  const engagement = grid.get(`${dayIdx}-${h}`) ?? 0;
                  const ratio =
                    maxEngagement > 0 ? engagement / maxEngagement : 0;
                  const isHighIntensity = ratio > 0.75;

                  return (
                    <div
                      key={h}
                      title={`${dayLabel} ${formatHour(h)} — ${engagement.toLocaleString()} engagement${engagement !== 1 ? "s" : ""}`}
                      className={cn(
                        "h-7 w-7 rounded-sm transition-colors sm:h-8 sm:w-8",
                        intensityClass(ratio),
                        isHighIntensity && "text-white",
                      )}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-gray-400">Less</span>
        <div className="flex gap-0.5">
          <div className="h-4 w-4 rounded-sm bg-gray-50" />
          <div className="h-4 w-4 rounded-sm bg-indigo-100" />
          <div className="h-4 w-4 rounded-sm bg-indigo-200" />
          <div className="h-4 w-4 rounded-sm bg-indigo-400" />
          <div className="h-4 w-4 rounded-sm bg-indigo-600" />
        </div>
        <span className="text-xs text-gray-400">More</span>
      </div>
    </div>
  );
}
