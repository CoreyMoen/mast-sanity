/**
 * Dashboard Page — Overview of social media activity and subscription usage.
 *
 * Shows post stats, quick actions, usage limit bars for the user's
 * current subscription tier, and an empty state for new users.
 */

"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileText, Plus, Link as LinkIcon, Zap, Crown } from "lucide-react";
import { UsageLimitBar } from "@/components/ui/usage-limit-bar";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";

export default function DashboardPage() {
  const postLimit = useQuery(api.featureGates.checkPostLimit);
  const accountLimit = useQuery(api.featureGates.checkAccountLimit);
  const aiLimit = useQuery(api.featureGates.checkAILimit);

  // null = auth not yet synced, undefined = query still loading
  const isLoading =
    postLimit === undefined || postLimit === null ||
    accountLimit === undefined || accountLimit === null ||
    aiLimit === undefined || aiLimit === null;

  // Derive tier label for display
  const tier = postLimit?.tier ?? "free";
  const tierLabel =
    tier === "free" ? "Free" : tier === "pro" ? "Pro" : "Business";

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Welcome */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Welcome back!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here is an overview of your social media activity.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
        >
          {tier !== "free" ? (
            <Crown className="h-3 w-3 text-indigo-600" />
          ) : (
            <Zap className="h-3 w-3 text-gray-400" />
          )}
          {tierLabel} Plan
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Posts This Month",
            value: String(postLimit!.current),
          },
          {
            label: "Post Limit",
            value: postLimit!.max === -1
              ? "Unlimited"
              : String(postLimit!.max),
          },
          {
            label: "Connected Accounts",
            value: String(accountLimit!.current),
          },
          {
            label: "AI Credits Used",
            value: String(aiLimit!.current),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white px-5 py-6 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Usage limits */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Usage Overview
          </h2>
          <Link
            href="/dashboard/settings"
            className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
          >
            Manage plan
          </Link>
        </div>
        <div className="mt-5 space-y-5">
          <UsageLimitBar
            label="Scheduled Posts"
            current={postLimit!.current}
            max={postLimit!.max}
          />
          <UsageLimitBar
            label="Connected Accounts"
            current={accountLimit!.current}
            max={accountLimit!.max}
          />
          <UsageLimitBar
            label="AI Credits"
            current={aiLimit!.current}
            max={aiLimit!.max}
          />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/dashboard/posts/new"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Create Post
          </Link>
          <Link
            href="/dashboard/accounts"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <LinkIcon className="h-4 w-4" />
            Connect Account
          </Link>
        </div>
      </div>

      {/* Empty state (visible when no posts exist) */}
      {postLimit!.current === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <FileText className="mx-auto h-10 w-10 text-gray-300" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            No posts yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first post to get started.
          </p>
          <Link
            href="/dashboard/posts/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Create Post
          </Link>
        </div>
      )}
    </div>
  );
}
