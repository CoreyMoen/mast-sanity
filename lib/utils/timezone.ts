import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Convert a UTC timestamp to a display string in the user's timezone.
 */
export function formatInUserTimezone(
  utcTimestamp: number,
  timezone: string,
  formatStr: string = "MMM d, yyyy h:mm a",
): string {
  return formatInTimeZone(new Date(utcTimestamp), timezone, formatStr);
}

/**
 * Convert a local date/time in a given timezone to a UTC timestamp.
 */
export function localToUtcTimestamp(
  localDate: Date,
  timezone: string,
): number {
  return fromZonedTime(localDate, timezone).getTime();
}

/**
 * Convert a UTC timestamp to a Date object in the user's timezone.
 */
export function utcToZonedDate(
  utcTimestamp: number,
  timezone: string,
): Date {
  return toZonedTime(new Date(utcTimestamp), timezone);
}

/**
 * Get the user's browser timezone.
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format a timestamp for display in a relative way (e.g., "in 2 hours", "3 days ago").
 */
export function formatRelative(utcTimestamp: number): string {
  const now = Date.now();
  const diff = utcTimestamp - now;
  const absDiff = Math.abs(diff);
  const isFuture = diff > 0;

  if (absDiff < 60_000) return "just now";

  const minutes = Math.floor(absDiff / 60_000);
  if (minutes < 60) {
    const label = minutes === 1 ? "minute" : "minutes";
    return isFuture ? `in ${minutes} ${label}` : `${minutes} ${label} ago`;
  }

  const hours = Math.floor(absDiff / 3_600_000);
  if (hours < 24) {
    const label = hours === 1 ? "hour" : "hours";
    return isFuture ? `in ${hours} ${label}` : `${hours} ${label} ago`;
  }

  const days = Math.floor(absDiff / 86_400_000);
  const label = days === 1 ? "day" : "days";
  return isFuture ? `in ${days} ${label}` : `${days} ${label} ago`;
}
