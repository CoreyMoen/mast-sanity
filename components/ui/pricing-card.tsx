/**
 * PricingCard — Reusable plan comparison card for the settings page.
 *
 * Displays plan name, price, feature list, and an action button
 * (current plan indicator, upgrade CTA, or downgrade notice).
 */

"use client";

import { Check, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PricingFeature {
  label: string;
  included: boolean;
}

export interface PricingCardProps {
  name: string;
  price: string;
  interval?: string;
  description: string;
  features: PricingFeature[];
  isCurrent: boolean;
  isPopular?: boolean;
  ctaLabel?: string;
  onCtaClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function PricingCard({
  name,
  price,
  interval = "/mo",
  description,
  features,
  isCurrent,
  isPopular,
  ctaLabel,
  onCtaClick,
  disabled,
  loading,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
        isCurrent
          ? "border-indigo-600 ring-2 ring-indigo-600"
          : "border-gray-200",
      )}
    >
      {/* Popular badge */}
      {isPopular && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
            <Crown className="h-3 w-3" />
            Popular
          </span>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
            Current Plan
          </span>
        </div>
      )}

      {/* Plan header */}
      <div className="mb-4 mt-2">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <span className="text-4xl font-bold tracking-tight text-gray-900">
          {price}
        </span>
        {price !== "Free" && (
          <span className="ml-1 text-sm font-medium text-gray-500">
            {interval}
          </span>
        )}
      </div>

      {/* Features */}
      <ul className="mb-8 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2">
            <Check
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                feature.included ? "text-indigo-600" : "text-gray-300",
              )}
            />
            <span
              className={cn(
                "text-sm",
                feature.included ? "text-gray-700" : "text-gray-400",
              )}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      {isCurrent ? (
        <button
          disabled
          className="w-full rounded-lg border border-indigo-600 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-600"
        >
          Current Plan
        </button>
      ) : (
        <button
          onClick={onCtaClick}
          disabled={disabled || loading}
          className={cn(
            "w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
            "bg-indigo-600 text-white hover:bg-indigo-700",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            ctaLabel ?? "Upgrade"
          )}
        </button>
      )}
    </div>
  );
}
