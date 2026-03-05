/**
 * UpgradeGate — Reusable wrapper that gates content behind a subscription tier.
 *
 * If the user's tier includes the feature, the children are rendered normally.
 * If not, the children are shown blurred underneath a translucent upgrade card
 * with a lock icon, feature description, and an upgrade CTA button.
 */

"use client";

import Link from "next/link";
import { Lock, Crown, ArrowRight } from "lucide-react";
import {
  isFeatureAvailable,
  getFeatureMeta,
  type GatedFeature,
} from "@/lib/utils/feature-gate";
import type { SubscriptionTier } from "@/lib/utils/validation";

export interface UpgradeGateProps {
  /** The feature being gated. */
  feature: GatedFeature;
  /** The user's current subscription tier. */
  tier: SubscriptionTier;
  /** Content to render if the user has access. */
  children: React.ReactNode;
}

export function UpgradeGate({ feature, tier, children }: UpgradeGateProps) {
  const allowed = isFeatureAvailable(feature, tier);

  if (allowed) {
    return <>{children}</>;
  }

  const meta = getFeatureMeta(feature);
  const tierLabel = meta.requiredTier === "pro" ? "Pro" : "Business";

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200">
      {/* Blurred content underneath */}
      <div
        className="pointer-events-none select-none blur-[6px]"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
        <div className="mx-4 w-full max-w-sm rounded-xl border border-indigo-100 bg-white p-6 text-center shadow-lg">
          {/* Lock icon */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
            <Lock className="h-6 w-6 text-indigo-600" />
          </div>

          {/* Feature name */}
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            {meta.label}
          </h3>

          {/* Description */}
          <p className="mt-2 text-sm text-gray-500">{meta.description}</p>

          {/* Tier badge */}
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Crown className="h-3 w-3" />
            Available on {tierLabel}
          </div>

          {/* Upgrade button */}
          <Link
            href="/dashboard/settings"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Upgrade to {tierLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
