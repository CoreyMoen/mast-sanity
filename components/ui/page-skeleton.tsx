"use client";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Shared pulse block primitive
// ---------------------------------------------------------------------------

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-gray-200", className)}
      aria-hidden
    />
  );
}

// ---------------------------------------------------------------------------
// DashboardSkeleton — matches the dashboard home page layout
// ---------------------------------------------------------------------------

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <Bone className="h-7 w-48" />
          <Bone className="mt-2 h-4 w-72" />
        </div>
        <Bone className="h-7 w-24 rounded-full" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white px-5 py-6 shadow-sm"
          >
            <Bone className="h-4 w-28" />
            <Bone className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Usage overview */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <Bone className="h-5 w-36" />
        <div className="mt-5 space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="flex justify-between">
                <Bone className="h-4 w-28" />
                <Bone className="h-4 w-20" />
              </div>
              <Bone className="mt-1.5 h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <Bone className="h-5 w-32" />
        <div className="mt-4 flex gap-3">
          <Bone className="h-10 w-32 rounded-lg" />
          <Bone className="h-10 w-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ListSkeleton — matches list views (posts, approvals)
// ---------------------------------------------------------------------------

interface ListSkeletonProps {
  rows?: number;
}

export function ListSkeleton({ rows = 6 }: ListSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <Bone className="h-9 min-w-[200px] flex-1 rounded-lg" />
        <Bone className="h-9 w-36 rounded-lg" />
        <Bone className="h-9 w-28 rounded-lg" />
        <Bone className="h-9 w-24 rounded-lg" />
      </div>

      {/* Select-all row */}
      <div className="flex items-center gap-3 px-4">
        <Bone className="h-4 w-4" />
        <Bone className="h-3 w-20" />
      </div>

      {/* List rows */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <ul className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="flex items-start gap-4 px-4 py-4">
              <Bone className="mt-0.5 h-4 w-4 shrink-0" />
              <Bone className="mt-0.5 h-5 w-20 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Bone className="h-4 w-full max-w-md" />
                <div className="mt-2 flex items-center gap-2">
                  <Bone className="h-5 w-16 rounded-full" />
                  <Bone className="h-3 w-24" />
                  <Bone className="h-3 w-20" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormSkeleton — matches form pages (composer, settings)
// ---------------------------------------------------------------------------

interface FormSkeletonProps {
  fields?: number;
}

export function FormSkeleton({ fields = 5 }: FormSkeletonProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Page title */}
      <div>
        <Bone className="h-7 w-56" />
        <Bone className="mt-2 h-4 w-80" />
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-6">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i}>
              <Bone className="h-4 w-24" />
              <Bone className="mt-2 h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>

        {/* Form actions */}
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
          <Bone className="h-10 w-20 rounded-lg" />
          <Bone className="h-10 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
