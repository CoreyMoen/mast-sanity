"use client";

import { useState } from "react";
import {
  Repeat,
  Calendar,
  Clock,
  Pause,
  Play,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "@/components/ui/platform-badge";

// ─── Types ───────────────────────────────────────────────────────────────────

type Frequency = "daily" | "weekly" | "biweekly" | "monthly" | "custom";

interface RecurringRule {
  _id: string;
  frequency: Frequency;
  customIntervalDays?: number;
  endType: "never" | "after_count" | "on_date";
  endAfterCount?: number;
  endOnDate?: number;
  nextOccurrence: number;
  templateContent: string;
  templatePlatforms: string[];
  templateHashtags: string[];
  templateMediaIds: string[];
  isActive: boolean;
  createdAt: number;
  upcomingOccurrences: number[];
}

interface RecurringRuleCardProps {
  rule: RecurringRule;
  onToggleActive: (ruleId: string, isActive: boolean) => void;
  onEdit: (ruleId: string) => void;
  onDelete: (ruleId: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function frequencyLabel(
  frequency: Frequency,
  customIntervalDays?: number,
): string {
  switch (frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Every 2 weeks";
    case "monthly":
      return "Monthly";
    case "custom":
      return customIntervalDays === 1
        ? "Every day"
        : `Every ${customIntervalDays} days`;
  }
}

function frequencyBadgeColor(frequency: Frequency): string {
  switch (frequency) {
    case "daily":
      return "bg-blue-50 text-blue-700";
    case "weekly":
      return "bg-indigo-50 text-indigo-700";
    case "biweekly":
      return "bg-violet-50 text-violet-700";
    case "monthly":
      return "bg-purple-50 text-purple-700";
    case "custom":
      return "bg-cyan-50 text-cyan-700";
  }
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  const isFuture = diff > 0;

  const minutes = Math.floor(absDiff / 60_000);
  const hours = Math.floor(absDiff / 3_600_000);
  const days = Math.floor(absDiff / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) {
    const label = minutes === 1 ? "minute" : "minutes";
    return isFuture ? `in ${minutes} ${label}` : `${minutes} ${label} ago`;
  }
  if (hours < 24) {
    const label = hours === 1 ? "hour" : "hours";
    return isFuture ? `in ${hours} ${label}` : `${hours} ${label} ago`;
  }
  const label = days === 1 ? "day" : "days";
  return isFuture ? `in ${days} ${label}` : `${days} ${label} ago`;
}

function truncateContent(text: string, maxLength = 120): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RecurringRuleCard({
  rule,
  onToggleActive,
  onEdit,
  onDelete,
}: RecurringRuleCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md",
        rule.isActive ? "border-gray-200" : "border-gray-200 opacity-70",
      )}
    >
      <div className="p-5">
        {/* Top row: frequency badge + active toggle + actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Frequency badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                frequencyBadgeColor(rule.frequency),
              )}
            >
              <Repeat className="h-3 w-3" />
              {frequencyLabel(rule.frequency, rule.customIntervalDays)}
            </span>

            {/* Platform badges */}
            <div className="flex items-center gap-1">
              {rule.templatePlatforms.map((p) => (
                <PlatformBadge key={p} platform={p} />
              ))}
            </div>

            {/* Active/Paused status */}
            {!rule.isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                <Pause className="h-3 w-3" />
                Paused
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-1">
            {/* Toggle active/paused */}
            <button
              type="button"
              onClick={() => onToggleActive(rule._id, !rule.isActive)}
              className={cn(
                "rounded-lg p-1.5 transition-colors",
                rule.isActive
                  ? "text-green-600 hover:bg-green-50"
                  : "text-gray-400 hover:bg-gray-100",
              )}
              title={rule.isActive ? "Pause rule" : "Resume rule"}
            >
              {rule.isActive ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onEdit(rule._id)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Edit rule"
            >
              <Edit className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(rule._id)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Delete rule"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content preview */}
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-gray-700">
            {truncateContent(rule.templateContent)}
          </p>
        </div>

        {/* Hashtags */}
        {rule.templateHashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {rule.templateHashtags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Next run + end type info */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Next: {formatRelativeTime(rule.nextOccurrence)}
          </span>

          {rule.endType === "after_count" && rule.endAfterCount && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Ends after {rule.endAfterCount} occurrences
            </span>
          )}

          {rule.endType === "on_date" && rule.endOnDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Ends {formatDateTime(rule.endOnDate)}
            </span>
          )}

          {rule.endType === "never" && (
            <span className="flex items-center gap-1.5">
              <Repeat className="h-3.5 w-3.5" />
              Runs indefinitely
            </span>
          )}
        </div>

        {/* Upcoming timeline toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          Upcoming schedule
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Expanded upcoming timeline */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Next Scheduled Posts
          </h4>
          <div className="space-y-2">
            {rule.upcomingOccurrences.map((ts, i) => (
              <div key={ts} className="flex items-center gap-3">
                {/* Timeline dot and line */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      i === 0 ? "bg-indigo-500" : "bg-gray-300",
                    )}
                  />
                  {i < rule.upcomingOccurrences.length - 1 && (
                    <div className="h-5 w-px bg-gray-200" />
                  )}
                </div>
                {/* Date label */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm",
                      i === 0
                        ? "font-medium text-gray-900"
                        : "text-gray-500",
                    )}
                  >
                    {formatDateTime(ts)}
                  </span>
                  {i === 0 && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                      NEXT
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
