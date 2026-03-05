/**
 * UsageLimitBar — Reusable progress bar showing usage against a tier limit.
 *
 * Displays a label, "X / Y used" text, and a color-coded progress bar.
 * Colors shift from indigo (normal) to amber (>80%) to red (>95%).
 * Shows "Unlimited" when max is -1 or Infinity.
 */

"use client";

import { cn } from "@/lib/utils";

export interface UsageLimitBarProps {
  /** Display label (e.g. "Scheduled Posts", "AI Credits"). */
  label: string;
  /** Current usage count. */
  current: number;
  /** Maximum allowed. -1 or Infinity means unlimited. */
  max: number;
  /** Fraction at which the bar turns amber. Default 0.8. */
  warningThreshold?: number;
}

export function UsageLimitBar({
  label,
  current,
  max,
  warningThreshold = 0.8,
}: UsageLimitBarProps) {
  const isUnlimited = max === -1 || max === Infinity;
  const ratio = isUnlimited ? 0 : max > 0 ? current / max : 0;
  const percentage = Math.min(ratio * 100, 100);

  const barColor = isUnlimited
    ? "bg-indigo-600"
    : ratio >= 1
      ? "bg-green-500"
      : ratio > warningThreshold
        ? "bg-amber-500"
        : "bg-indigo-600";

  const textColor = isUnlimited
    ? "text-gray-600"
    : ratio >= 1
      ? "text-green-600"
      : ratio > warningThreshold
        ? "text-amber-600"
        : "text-gray-600";

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={cn("tabular-nums", textColor)}>
          {isUnlimited ? (
            <>
              {current} used{" "}
              <span className="text-gray-400">&middot; Unlimited</span>
            </>
          ) : (
            <>
              {current} / {max} used
            </>
          )}
        </span>
      </div>

      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barColor)}
          style={{
            width: isUnlimited
              ? "0%"
              : `${percentage}%`,
          }}
        />
      </div>

      {/* Warning text when close to or at limit */}
      {!isUnlimited && ratio >= 1 && (
        <p className="mt-1 text-xs text-green-600">
          Limit reached — upgrade for more.
        </p>
      )}
      {!isUnlimited && ratio > warningThreshold && ratio < 1 && (
        <p className="mt-1 text-xs text-amber-500">
          Approaching your limit ({Math.round(percentage)}% used).
        </p>
      )}
    </div>
  );
}
