"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Repeat,
  Calendar,
  Clock,
  Globe,
  Save,
  X,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrowserTimezone } from "@/lib/utils/timezone";

// ─── Constants ───────────────────────────────────────────────────────────────

type Frequency = "daily" | "weekly" | "biweekly" | "monthly" | "custom";
type EndType = "never" | "after_count" | "on_date";

const FREQUENCY_OPTIONS: { value: Frequency; label: string; description: string }[] = [
  { value: "daily", label: "Daily", description: "Every day" },
  { value: "weekly", label: "Weekly", description: "Once a week" },
  { value: "biweekly", label: "Biweekly", description: "Every 2 weeks" },
  { value: "monthly", label: "Monthly", description: "Once a month" },
  { value: "custom", label: "Custom", description: "Set your own interval" },
];

const PLATFORMS = [
  {
    id: "instagram",
    label: "Instagram",
    icon: Instagram,
    color: "text-pink-600",
    bgActive: "bg-pink-50",
    borderActive: "border-pink-300",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    bgActive: "bg-blue-50",
    borderActive: "border-blue-300",
  },
  {
    id: "twitter",
    label: "X / Twitter",
    icon: Twitter,
    color: "text-sky-500",
    bgActive: "bg-sky-50",
    borderActive: "border-sky-300",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-700",
    bgActive: "bg-slate-50",
    borderActive: "border-slate-300",
  },
] as const;

const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "UTC",
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface RecurringRuleFormData {
  frequency: Frequency;
  customIntervalDays?: number;
  endType: EndType;
  endAfterCount?: number;
  endOnDate?: string; // ISO date string
  nextOccurrence: number; // UTC timestamp
  templateContent: string;
  templatePlatforms: string[];
  templateHashtags: string[];
  templateMediaIds: string[];
}

interface RecurringRuleFormProps {
  /** If provided, the form pre-fills for editing. */
  initialData?: {
    frequency: Frequency;
    customIntervalDays?: number;
    endType: EndType;
    endAfterCount?: number;
    endOnDate?: number;
    nextOccurrence: number;
    templateContent: string;
    templatePlatforms: string[];
    templateHashtags: string[];
  };
  onSave: (data: RecurringRuleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLocalDateString(timestamp: number, tz: string): string {
  try {
    const date = new Date(timestamp);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((p) => p.type === "year")?.value ?? "";
    const month = parts.find((p) => p.type === "month")?.value ?? "";
    const day = parts.find((p) => p.type === "day")?.value ?? "";
    return `${year}-${month}-${day}`;
  } catch {
    return new Date(timestamp).toISOString().slice(0, 10);
  }
}

function toLocalTimeString(timestamp: number, tz: string): string {
  try {
    const date = new Date(timestamp);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);

    const hour = parts.find((p) => p.type === "hour")?.value ?? "09";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
    return `${hour}:${minute}`;
  } catch {
    return "09:00";
  }
}

function localDateTimeToUtc(
  dateStr: string,
  timeStr: string,
  tz: string,
): number {
  // Create an ISO string and use Intl to find the UTC offset
  // Fallback: parse as local and convert
  try {
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    // Use a simple approach: create date in the target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Parse the date/time string into a Date object
    const targetDate = new Date(dateTimeStr);

    // Format target date (used for offset calculation reference)
    formatter.format(targetDate);

    // Calculate the offset by comparing
    // This is a simplified approach; for production we'd use date-fns-tz
    const utcGuess = targetDate.getTime();

    // Check what time that UTC timestamp displays in the target timezone
    const inTzParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(utcGuess));

    const tzDate = `${inTzParts.find((p) => p.type === "year")?.value}-${inTzParts.find((p) => p.type === "month")?.value}-${inTzParts.find((p) => p.type === "day")?.value}`;
    const tzHour = inTzParts.find((p) => p.type === "hour")?.value ?? "0";
    const tzMinute = inTzParts.find((p) => p.type === "minute")?.value ?? "0";
    const tzTime = `${tzHour}:${tzMinute}`;

    // If they match, great. If not, compute the offset.
    if (tzDate === dateStr && tzTime === timeStr) {
      return utcGuess;
    }

    // Calculate the difference and adjust
    const tzTimestamp = new Date(`${tzDate}T${tzTime}:00Z`).getTime();
    const wantedTimestamp = new Date(`${dateStr}T${timeStr}:00Z`).getTime();
    const offset = tzTimestamp - wantedTimestamp;

    return utcGuess - offset;
  } catch {
    // Fallback: treat as UTC
    return new Date(`${dateStr}T${timeStr}:00Z`).getTime();
  }
}

function calculatePreviewDates(
  startTimestamp: number,
  frequency: Frequency,
  customIntervalDays: number | undefined,
  count: number,
): number[] {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const result: number[] = [];
  let current = startTimestamp;

  for (let i = 0; i < count; i++) {
    result.push(current);

    if (frequency === "monthly") {
      const date = new Date(current);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();

      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }

      const daysInNextMonth = new Date(
        Date.UTC(nextYear, nextMonth + 1, 0),
      ).getUTCDate();
      const clampedDay = Math.min(day, daysInNextMonth);

      current = Date.UTC(nextYear, nextMonth, clampedDay, hours, minutes);
    } else {
      const intervalDays = {
        daily: 1,
        weekly: 7,
        biweekly: 14,
        custom: customIntervalDays ?? 1,
      }[frequency];
      current += intervalDays * DAY_MS;
    }
  }

  return result;
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RecurringRuleForm({
  initialData,
  onSave,
  onCancel,
  isSubmitting = false,
}: RecurringRuleFormProps) {
  // ─── State ─────────────────────────────────────────────────────────────────

  const [frequency, setFrequency] = useState<Frequency>(
    initialData?.frequency ?? "weekly",
  );
  const [customIntervalDays, setCustomIntervalDays] = useState<number>(
    initialData?.customIntervalDays ?? 3,
  );
  const [endType, setEndType] = useState<EndType>(
    initialData?.endType ?? "never",
  );
  const [endAfterCount, setEndAfterCount] = useState<number>(
    initialData?.endAfterCount ?? 10,
  );

  const [timezone, setTimezone] = useState(() => getBrowserTimezone());

  const [startDate, setStartDate] = useState(() => {
    if (initialData?.nextOccurrence) {
      return toLocalDateString(initialData.nextOccurrence, getBrowserTimezone());
    }
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });

  const [startTime, setStartTime] = useState(() => {
    if (initialData?.nextOccurrence) {
      return toLocalTimeString(initialData.nextOccurrence, getBrowserTimezone());
    }
    return "09:00";
  });

  const [endOnDate, setEndOnDate] = useState(() => {
    if (initialData?.endOnDate) {
      return toLocalDateString(initialData.endOnDate, getBrowserTimezone());
    }
    // Default to 3 months from now
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    return threeMonths.toISOString().slice(0, 10);
  });

  const [templateContent, setTemplateContent] = useState(
    initialData?.templateContent ?? "",
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    initialData?.templatePlatforms ?? [],
  );
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>(
    initialData?.templateHashtags ?? [],
  );

  // ─── Computed values ───────────────────────────────────────────────────────

  const nextOccurrenceTimestamp = useMemo(
    () => localDateTimeToUtc(startDate, startTime, timezone),
    [startDate, startTime, timezone],
  );

  const previewDates = useMemo(
    () =>
      calculatePreviewDates(
        nextOccurrenceTimestamp,
        frequency,
        frequency === "custom" ? customIntervalDays : undefined,
        3,
      ),
    [nextOccurrenceTimestamp, frequency, customIntervalDays],
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const togglePlatform = useCallback((platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId],
    );
  }, []);

  function addHashtag() {
    const tag = hashtagInput.replace(/^#/, "").trim().toLowerCase();
    if (!tag || hashtags.includes(tag)) return;
    setHashtags((prev) => [...prev, tag]);
    setHashtagInput("");
  }

  function removeHashtag(tag: string) {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  }

  function handleHashtagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addHashtag();
    }
  }

  async function handleSubmit() {
    await onSave({
      frequency,
      customIntervalDays: frequency === "custom" ? customIntervalDays : undefined,
      endType,
      endAfterCount: endType === "after_count" ? endAfterCount : undefined,
      endOnDate: endOnDate && endType === "on_date" ? endOnDate : undefined,
      nextOccurrence: nextOccurrenceTimestamp,
      templateContent,
      templatePlatforms: selectedPlatforms,
      templateHashtags: hashtags,
      templateMediaIds: [],
    });
  }

  // ─── Validation ────────────────────────────────────────────────────────────

  const hasContent = templateContent.trim().length > 0;
  const hasPlatforms = selectedPlatforms.length > 0;
  const hasValidDate = startDate && startTime;
  const canSubmit = hasContent && hasPlatforms && hasValidDate && !isSubmitting;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Post template */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <label
          htmlFor="template-content"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Post Template
        </label>
        <p className="mb-3 text-xs text-gray-400">
          This content will be used each time a recurring post is generated.
        </p>
        <textarea
          id="template-content"
          value={templateContent}
          onChange={(e) => setTemplateContent(e.target.value)}
          placeholder="Write your recurring post content..."
          className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          rows={5}
        />
      </div>

      {/* Platform selection */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="mb-3 block text-sm font-medium text-gray-700">
          Platforms
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PLATFORMS.map((platform) => {
            const selected = selectedPlatforms.includes(platform.id);
            const Icon = platform.icon;
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => togglePlatform(platform.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all",
                  selected
                    ? cn(
                        platform.bgActive,
                        platform.borderActive,
                        platform.color,
                      )
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                <Icon className="h-4 w-4" />
                {platform.label}
              </button>
            );
          })}
        </div>
        {!hasPlatforms && (
          <p className="mt-2 text-xs text-amber-600">
            Select at least one platform.
          </p>
        )}
      </div>

      {/* Hashtags */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Hashtags
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={handleHashtagKeyDown}
            placeholder="Add a hashtag..."
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={addHashtag}
            disabled={!hashtagInput.trim()}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              hashtagInput.trim()
                ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                : "cursor-not-allowed bg-gray-100 text-gray-400",
            )}
          >
            Add
          </button>
        </div>
        {hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeHashtag(tag)}
                  className="ml-0.5 rounded-full p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Frequency selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="mb-3 block text-sm font-medium text-gray-700">
          <Repeat className="mr-1.5 inline h-4 w-4 text-indigo-600" />
          Frequency
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {FREQUENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFrequency(option.value)}
              className={cn(
                "rounded-lg border-2 px-3 py-2.5 text-center transition-all",
                frequency === option.value
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
              )}
            >
              <div className="text-sm font-semibold">{option.label}</div>
              <div className="mt-0.5 text-[11px] text-gray-400">
                {option.description}
              </div>
            </button>
          ))}
        </div>

        {/* Custom interval input */}
        {frequency === "custom" && (
          <div className="mt-4">
            <label
              htmlFor="custom-interval"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Repeat every
            </label>
            <div className="flex items-center gap-2">
              <input
                id="custom-interval"
                type="number"
                min={1}
                max={365}
                value={customIntervalDays}
                onChange={(e) =>
                  setCustomIntervalDays(
                    Math.max(1, parseInt(e.target.value) || 1),
                  )
                }
                className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600">days</span>
            </div>
          </div>
        )}
      </div>

      {/* Schedule: start date, time, timezone */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="mb-3 block text-sm font-medium text-gray-700">
          <Clock className="mr-1.5 inline h-4 w-4 text-indigo-600" />
          Start Date & Time
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="start-date"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="start-time"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Time
            </label>
            <input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="start-timezone"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Timezone
            </label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                id="start-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* End condition */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="mb-3 block text-sm font-medium text-gray-700">
          <Calendar className="mr-1.5 inline h-4 w-4 text-indigo-600" />
          End Condition
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEndType("never")}
            className={cn(
              "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
              endType === "never"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
            )}
          >
            Never
          </button>
          <button
            type="button"
            onClick={() => setEndType("after_count")}
            className={cn(
              "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
              endType === "after_count"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
            )}
          >
            After N posts
          </button>
          <button
            type="button"
            onClick={() => setEndType("on_date")}
            className={cn(
              "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
              endType === "on_date"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
            )}
          >
            On a date
          </button>
        </div>

        {endType === "after_count" && (
          <div className="mt-4">
            <label
              htmlFor="end-after-count"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Number of posts
            </label>
            <input
              id="end-after-count"
              type="number"
              min={1}
              max={1000}
              value={endAfterCount}
              onChange={(e) =>
                setEndAfterCount(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}

        {endType === "on_date" && (
          <div className="mt-4">
            <label
              htmlFor="end-on-date"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              End date
            </label>
            <input
              id="end-on-date"
              type="date"
              value={endOnDate}
              onChange={(e) => setEndOnDate(e.target.value)}
              className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Preview of next 3 scheduled dates */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-indigo-900">
          <Calendar className="h-4 w-4" />
          Preview: Next 3 Scheduled Posts
        </h3>
        <div className="space-y-2">
          {previewDates.map((ts, i) => (
            <div key={ts} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    i === 0 ? "bg-indigo-500" : "bg-indigo-300",
                  )}
                />
                {i < previewDates.length - 1 && (
                  <div className="h-5 w-px bg-indigo-200" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm",
                  i === 0
                    ? "font-medium text-indigo-900"
                    : "text-indigo-700",
                )}
              >
                {formatDateTime(ts)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors",
            canSubmit
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "cursor-not-allowed bg-indigo-400 opacity-50",
          )}
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? "Saving..." : initialData ? "Update Rule" : "Create Rule"}
        </button>
      </div>
    </div>
  );
}
