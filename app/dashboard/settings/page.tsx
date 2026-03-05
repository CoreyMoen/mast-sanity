/**
 * Settings Page — Account settings with profile, subscription, AI, and billing.
 *
 * Displays the user's profile info from Clerk, current subscription tier,
 * plan comparison cards, AI provider/key configuration, usage tracking,
 * and billing management controls.
 */

"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Settings,
  User,
  CreditCard,
  Crown,
  Zap,
  Building2,
  ExternalLink,
  AlertCircle,
  Brain,
} from "lucide-react";
import { ErrorBanner } from "@/components/ui/error-banner";
import { cn } from "@/lib/utils";
import { TIER_LIMITS } from "@/lib/utils/validation";
import { PricingCard } from "@/components/ui/pricing-card";
import type { PricingFeature } from "@/components/ui/pricing-card";
import { AISettings } from "@/components/settings/ai-settings";
import { AIUsageCard } from "@/components/settings/ai-usage-card";
import { DataRetentionCard } from "@/components/settings/data-retention-card";
import { FormSkeleton } from "@/components/ui/page-skeleton";

// ─── Tab definitions ──────────────────────────────────────────────────────────

type SettingsTab = "profile" | "subscription" | "ai" | "billing";

const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "subscription", label: "Subscription", icon: Crown },
  { id: "ai", label: "AI Settings", icon: Brain },
  { id: "billing", label: "Billing", icon: CreditCard },
];

// ─── Plan configurations ──────────────────────────────────────────────────────

const PLAN_CONFIG = {
  free: {
    name: "Free",
    price: "Free",
    description: "Get started with basic scheduling",
    priceId: "",
  },
  pro: {
    name: "Pro",
    price: "$19",
    description: "For creators and small teams",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "",
  },
  business: {
    name: "Business",
    price: "$49",
    description: "For agencies and growing teams",
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID ?? "",
  },
} as const;

function getFeaturesForTier(
  tier: keyof typeof TIER_LIMITS,
): PricingFeature[] {
  const limits = TIER_LIMITS[tier];
  return [
    {
      label: `${limits.connectedAccounts} connected account${limits.connectedAccounts > 1 ? "s" : ""}`,
      included: true,
    },
    {
      label:
        limits.scheduledPostsPerMonth === Infinity
          ? "Unlimited scheduled posts"
          : `${limits.scheduledPostsPerMonth} scheduled posts/mo`,
      included: true,
    },
    {
      label: `${limits.teamMembers} team member${limits.teamMembers > 1 ? "s" : ""}`,
      included: true,
    },
    {
      label:
        limits.aiCreditsPerMonth === Infinity
          ? "Unlimited AI credits"
          : `${limits.aiCreditsPerMonth} AI credits/mo`,
      included: true,
    },
    {
      label: `${limits.analyticsRetentionDays}-day analytics`,
      included: true,
    },
    {
      label: "Approval workflows",
      included: limits.approvalWorkflows,
    },
    {
      label: "Recurring posts",
      included: limits.recurringPosts,
    },
    {
      label: "Priority support",
      included: limits.prioritySupport,
    },
    {
      label: "Custom branding",
      included: limits.customBranding,
    },
  ];
}

// ─── Settings Page Component ──────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const subscription = useQuery(api.billing.getSubscription);
  const createCheckout = useAction(api.billing.createCheckoutSession);
  const createPortal = useAction(api.billing.createPortalSession);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTier = (subscription?.tier ?? "free") as "free" | "pro" | "business";
  const subscriptionStatus = (subscription?.status ?? "active") as "active" | "past_due" | "canceled";

  // ── Handle upgrade to a paid tier ─────────────────────────────────────────
  const handleUpgrade = useCallback(
    async (tier: "pro" | "business") => {
      setError(null);
      setLoadingTier(tier);
      try {
        const result = await createCheckout({
          tier,
          successUrl: `${window.location.origin}/dashboard/settings?upgraded=true`,
          cancelUrl: `${window.location.origin}/dashboard/settings`,
        });
        if (result.url) {
          window.location.href = result.url;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create checkout session",
        );
      } finally {
        setLoadingTier(null);
      }
    },
    [createCheckout],
  );

  // ── Handle Stripe billing portal ──────────────────────────────────────────
  const handleManageBilling = useCallback(async () => {
    setError(null);
    setPortalLoading(true);
    try {
      const result = await createPortal({
        returnUrl: `${window.location.origin}/dashboard/settings`,
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to open billing portal",
      );
    } finally {
      setPortalLoading(false);
    }
  }, [createPortal]);

  // ── Tier badge styling ────────────────────────────────────────────────────
  const tierBadge = {
    free: { label: "Free", className: "bg-gray-100 text-gray-700" },
    pro: { label: "Pro", className: "bg-indigo-100 text-indigo-700" },
    business: { label: "Business", className: "bg-purple-100 text-purple-700" },
  };

  const statusBadge = {
    active: { label: "Active", className: "bg-green-100 text-green-700" },
    past_due: { label: "Past Due", className: "bg-amber-100 text-amber-700" },
    canceled: { label: "Canceled", className: "bg-red-100 text-red-700" },
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!clerkLoaded || subscription === undefined || subscription === null) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3">
          <Settings className="h-7 w-7 text-indigo-600" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Settings
          </h1>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Manage your account, subscription, and billing.
        </p>
        <div className="mt-8">
          <FormSkeleton fields={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-indigo-600" />
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          Settings
        </h1>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        Manage your account, subscription, and billing.
      </p>

      {/* Error banner */}
      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {/* Tab navigation */}
      <div className="mt-8 border-b border-gray-200">
        <nav className="-mb-px flex gap-4 overflow-x-auto sm:gap-6" aria-label="Settings tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors sm:min-h-0",
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-8">
        {/* ── Profile Tab ──────────────────────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Profile Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your account details managed through Clerk.
              </p>

              {!clerkLoaded ? (
                <div className="mt-6 space-y-4">
                  <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-64 animate-pulse rounded bg-gray-200" />
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-4">
                    {clerkUser?.imageUrl && (
                      <Image
                        src={clerkUser.imageUrl}
                        alt=""
                        width={64}
                        height={64}
                        className="rounded-full border border-gray-200"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {clerkUser?.fullName ?? "User"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {clerkUser?.primaryEmailAddress?.emailAddress ?? ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                        {clerkUser?.firstName ?? "--"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                        {clerkUser?.lastName ?? "--"}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                        {clerkUser?.primaryEmailAddress?.emailAddress ?? "--"}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">
                    To update your profile, use the account menu in the sidebar.
                  </p>
                </div>
              )}
            </div>

            {/* AI Credits usage — pulls real data from aiUsage query */}
            <AIUsageCard compact onUpgradeClick={() => setActiveTab("subscription")} />
          </div>
        )}

        {/* ── Subscription Tab ────────────────────────────────────────────── */}
        {activeTab === "subscription" && (
          <div className="space-y-8">
            {/* Current plan summary */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Current Plan
                  </h2>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        tierBadge[currentTier].className,
                      )}
                    >
                      {currentTier !== "free" && (
                        <Crown className="h-3 w-3" />
                      )}
                      {tierBadge[currentTier].label}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        statusBadge[subscriptionStatus].className,
                      )}
                    >
                      {statusBadge[subscriptionStatus].label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {PLAN_CONFIG[currentTier].description}
                  </p>
                </div>

                {/* Manage billing button for paid users */}
                {currentTier !== "free" && subscription?.stripeCustomerId && (
                  <button
                    onClick={handleManageBilling}
                    disabled={portalLoading}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    {portalLoading ? (
                      <>
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
                        Opening...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4" />
                        Manage Billing
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Past due warning */}
              {subscriptionStatus === "past_due" && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Your payment is past due. Please update your payment method to
                  keep your subscription active.
                  {subscription?.stripeCustomerId && (
                    <button
                      onClick={handleManageBilling}
                      className="ml-auto font-semibold underline hover:no-underline"
                    >
                      Update Payment
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Plan comparison cards */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Compare Plans
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Choose the plan that best fits your needs.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                <PricingCard
                  name={PLAN_CONFIG.free.name}
                  price={PLAN_CONFIG.free.price}
                  description={PLAN_CONFIG.free.description}
                  features={getFeaturesForTier("free")}
                  isCurrent={currentTier === "free"}
                  ctaLabel="Current Plan"
                  disabled={currentTier === "free"}
                />
                <PricingCard
                  name={PLAN_CONFIG.pro.name}
                  price={PLAN_CONFIG.pro.price}
                  description={PLAN_CONFIG.pro.description}
                  features={getFeaturesForTier("pro")}
                  isCurrent={currentTier === "pro"}
                  isPopular
                  ctaLabel={
                    currentTier === "business" ? "Downgrade to Pro" : "Upgrade to Pro"
                  }
                  onCtaClick={() => handleUpgrade("pro")}
                  loading={loadingTier === "pro"}
                  disabled={loadingTier !== null}
                />
                <PricingCard
                  name={PLAN_CONFIG.business.name}
                  price={PLAN_CONFIG.business.price}
                  description={PLAN_CONFIG.business.description}
                  features={getFeaturesForTier("business")}
                  isCurrent={currentTier === "business"}
                  ctaLabel="Upgrade to Business"
                  onCtaClick={() => handleUpgrade("business")}
                  loading={loadingTier === "business"}
                  disabled={loadingTier !== null}
                />
              </div>
            </div>

            {/* Data retention policy */}
            <DataRetentionCard onUpgradeClick={() => setActiveTab("subscription")} />
          </div>
        )}

        {/* ── AI Settings Tab ──────────────────────────────────────────── */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <AISettings />
            <AIUsageCard onUpgradeClick={() => setActiveTab("subscription")} />
          </div>
        )}

        {/* ── Billing Tab ─────────────────────────────────────────────────── */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Billing Overview
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your payment method and view billing history.
              </p>

              <div className="mt-6 space-y-4">
                {/* Current plan summary */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    {currentTier === "free" ? (
                      <Zap className="h-5 w-5 text-gray-400" />
                    ) : currentTier === "pro" ? (
                      <Crown className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <Building2 className="h-5 w-5 text-purple-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {PLAN_CONFIG[currentTier].name} Plan
                      </p>
                      <p className="text-xs text-gray-500">
                        {currentTier === "free"
                          ? "No active subscription"
                          : `${PLAN_CONFIG[currentTier].price}/month`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      statusBadge[subscriptionStatus].className,
                    )}
                  >
                    {statusBadge[subscriptionStatus].label}
                  </span>
                </div>

                {/* Actions */}
                {currentTier === "free" ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-6 py-8 text-center">
                    <CreditCard className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-3 text-sm font-medium text-gray-900">
                      No active subscription
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Upgrade to Pro or Business to unlock more features.
                    </p>
                    <button
                      onClick={() => setActiveTab("subscription")}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                    >
                      <Crown className="h-4 w-4" />
                      View Plans
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Manage billing portal */}
                    {subscription?.stripeCustomerId && (
                      <button
                        onClick={handleManageBilling}
                        disabled={portalLoading}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-gray-50",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Payment Method
                            </p>
                            <p className="text-xs text-gray-500">
                              Update your card or payment details
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </button>
                    )}

                    {/* Invoice history link */}
                    {subscription?.stripeCustomerId && (
                      <button
                        onClick={handleManageBilling}
                        disabled={portalLoading}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-gray-50",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Settings className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Invoice History
                            </p>
                            <p className="text-xs text-gray-500">
                              View and download past invoices
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </button>
                    )}

                    {/* Cancel subscription */}
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div>
                          <p className="text-sm font-medium text-red-900">
                            Cancel Subscription
                          </p>
                          <p className="text-xs text-red-600">
                            To cancel your subscription, use the Manage Billing
                            portal above. Your plan will remain active until the
                            end of the current billing period.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
