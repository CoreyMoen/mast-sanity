"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

const CalendarView = dynamic(() => import("@/components/calendar/calendar-view").then(mod => ({ default: mod.CalendarView })), { ssr: false });

export default function CalendarPage() {
  const postLimit = useQuery(api.featureGates.checkPostLimit);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Calendar
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Schedule and manage your posts.
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
              <CalendarIcon className="h-3 w-3" />
              {postLimit.max === Infinity
                ? `${postLimit.current} posts · Unlimited`
                : `${postLimit.current}/${postLimit.max} posts this month`}
            </div>
          )}
        </div>

        <Link
          href="/dashboard/posts/new"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:min-h-0"
        >
          <Plus className="h-4 w-4" />
          Create Post
        </Link>
      </div>

      <div className="mt-6">
        <CalendarView />
      </div>
    </div>
  );
}
