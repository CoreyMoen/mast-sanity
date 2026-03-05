"use client";

import { useState } from "react";
import { X, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  localToUtcTimestamp,
  getBrowserTimezone,
} from "@/lib/utils/timezone";

// ── Common IANA timezone options ─────────────────────────────────────────────
const TIMEZONE_OPTIONS = [
  { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
  { value: "America/Anchorage", label: "Alaska (AKST)" },
  { value: "America/Los_Angeles", label: "Pacific (PST)" },
  { value: "America/Denver", label: "Mountain (MST)" },
  { value: "America/Chicago", label: "Central (CST)" },
  { value: "America/New_York", label: "Eastern (EST)" },
  { value: "America/Sao_Paulo", label: "Brasilia (BRT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central Europe (CET)" },
  { value: "Europe/Helsinki", label: "Eastern Europe (EET)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Pacific/Auckland", label: "New Zealand (NZST)" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Return tomorrow's date as YYYY-MM-DD */
function defaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Return today's date as YYYY-MM-DD (for min attribute) */
function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Resolve the user's browser timezone to its closest TIMEZONE_OPTIONS entry */
function resolveDefaultTimezone(): string {
  const browser = getBrowserTimezone();
  const match = TIMEZONE_OPTIONS.find((tz) => tz.value === browser);
  return match ? match.value : "America/New_York";
}

// ── Component ────────────────────────────────────────────────────────────────

interface RescheduleModalProps {
  open: boolean;
  onClose: () => void;
  postIds: string[];
  onReschedule: (postIds: string[], scheduledAt: number) => Promise<void>;
}

export function RescheduleModal({
  open,
  onClose,
  postIds,
  onReschedule,
}: RescheduleModalProps) {
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");
  const [timezone, setTimezone] = useState(resolveDefaultTimezone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!date || !time) {
      setError("Please select both a date and time.");
      return;
    }

    // Build a local Date from the date + time inputs
    const localDate = new Date(`${date}T${time}:00`);
    const utcTimestamp = localToUtcTimestamp(localDate, timezone);

    if (utcTimestamp <= Date.now()) {
      setError("Scheduled time must be in the future.");
      return;
    }

    setLoading(true);
    try {
      await onReschedule(postIds, utcTimestamp);
      onClose();
    } catch {
      setError("Failed to reschedule. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Reschedule {postIds.length} post{postIds.length !== 1 ? "s" : ""}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          Choose a new date and time to reschedule the selected post
          {postIds.length !== 1 ? "s" : ""}.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Date */}
          <div>
            <label
              htmlFor="reschedule-date"
              className="block text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <input
              id="reschedule-date"
              type="date"
              value={date}
              min={todayDate()}
              onChange={(e) => {
                setDate(e.target.value);
                if (error) setError("");
              }}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>

          {/* Time */}
          <div>
            <label
              htmlFor="reschedule-time"
              className="block text-sm font-medium text-gray-700"
            >
              Time
            </label>
            <input
              id="reschedule-time"
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                if (error) setError("");
              }}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>

          {/* Timezone */}
          <div>
            <label
              htmlFor="reschedule-tz"
              className="block text-sm font-medium text-gray-700"
            >
              Timezone
            </label>
            <select
              id="reschedule-tz"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 sm:min-h-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 sm:min-h-0",
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                "Reschedule"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
