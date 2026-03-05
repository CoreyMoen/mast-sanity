"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PostList } from "@/components/ui/post-list";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type TabValue = "all" | "scheduled" | "draft" | "published" | "failed";

const TABS: { value: TabValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
  { value: "failed", label: "Failed" },
];

export default function PostsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const postLimit = useQuery(api.featureGates.checkPostLimit);

  // Map tab value to the status preset passed to PostList.
  // "all" means no preset -- the list shows all statuses and exposes
  // its own status dropdown.
  const statusPreset = activeTab === "all" ? null : activeTab;

  return (
    <div className="mx-auto max-w-5xl">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FileText className="h-7 w-7 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Posts
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Manage your content queue, review scheduled posts, and track
            published content.
          </p>
          {postLimit && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                postLimit.max === Infinity
                  ? "bg-gray-100 text-gray-600"
                  : postLimit.current / postLimit.max >= 1
                    ? "bg-red-50 text-red-700"
                    : postLimit.current / postLimit.max > 0.8
                      ? "bg-amber-50 text-amber-700"
                      : "bg-gray-100 text-gray-600",
              )}
            >
              <FileText className="h-3 w-3" />
              {postLimit.max === Infinity
                ? `${postLimit.current} posts · Unlimited`
                : `${postLimit.current}/${postLimit.max} posts this month`}
            </div>
          )}
        </div>

        <Link
          href="/dashboard/posts/new"
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Create Post
        </Link>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-4 overflow-x-auto sm:gap-6" aria-label="Post status tabs">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "min-h-[44px] whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors sm:min-h-0",
                activeTab === tab.value
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Post list ───────────────────────────────────────────────────── */}
      <div className="mt-6 pb-20">
        {/*
          Key on activeTab so the PostList resets its internal filter/selection
          state when switching tabs.
        */}
        <PostList key={activeTab} statusPreset={statusPreset} />
      </div>
    </div>
  );
}
