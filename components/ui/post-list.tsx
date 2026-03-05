"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Trash2,
  Copy,
  Edit,
  Calendar,
  ChevronDown,
  X,
  Clock,
  CheckSquare,
  Square,
  MinusSquare,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { formatRelative } from "@/lib/utils/timezone";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/ui/toast";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { RescheduleModal } from "@/components/ui/reschedule-modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PostStatus =
  | "draft"
  | "pending_approval"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

type Platform = "instagram" | "facebook" | "twitter" | "linkedin";

type SortField = "date" | "platform" | "status";

// ---------------------------------------------------------------------------
// Filter / sort helpers
// ---------------------------------------------------------------------------

const ALL_PLATFORMS: Platform[] = [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
];

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
};

const STATUS_OPTIONS: { value: PostStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "failed", label: "Failed" },
];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "platform", label: "Platform" },
  { value: "status", label: "Status" },
];

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "...";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PlatformMultiSelect({
  selected,
  onChange,
}: {
  selected: Platform[];
  onChange: (v: Platform[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === 0;

  function toggle(p: Platform) {
    if (selected.includes(p)) {
      onChange(selected.filter((x) => x !== p));
    } else {
      onChange([...selected, p]);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 sm:min-h-0"
      >
        <span>
          {allSelected
            ? "All Platforms"
            : selected.map((p) => PLATFORM_LABELS[p]).join(", ")}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50",
                allSelected && "font-medium text-indigo-600"
              )}
            >
              All Platforms
            </button>
            {ALL_PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => toggle(p)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50",
                  selected.includes(p) && "font-medium text-indigo-600"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border",
                    selected.includes(p)
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-gray-300"
                  )}
                >
                  {selected.includes(p) && (
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PostList component
// ---------------------------------------------------------------------------

interface PostListProps {
  statusPreset?: PostStatus | null;
}

export function PostList({ statusPreset = null }: PostListProps) {
  const toast = useToast();

  // Convex queries and mutations
  const statusArg = statusPreset
    ? (statusPreset as PostStatus)
    : undefined;

  const rawPosts = useQuery(api.posts.list, {
    status: statusArg,
    limit: 100,
  });
  const removePost = useMutation(api.posts.remove);
  const duplicatePost = useMutation(api.posts.duplicate);

  const isLoading = rawPosts === undefined || rawPosts === null;

  // Filters
  const [platformFilter, setPlatformFilter] = useState<Platform[]>([]);
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">(
    statusPreset ?? "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("date");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Deleting
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reschedule modal
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [reschedulePostIds, setReschedulePostIds] = useState<string[]>([]);
  const reschedulePost = useMutation(api.scheduling.reschedulePost);

  const DAY = 86_400_000;

  // Apply client-side filters on top of the Convex-returned posts
  const filteredPosts = useMemo(() => {
    if (!rawPosts) return [];
    let result = [...rawPosts];

    // Status filter (only when no preset -- when preset is set, Convex already filters)
    if (!statusPreset && statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Platform filter
    if (platformFilter.length > 0) {
      result = result.filter((p) =>
        p.platforms.some((pl: string) => platformFilter.includes(pl as Platform))
      );
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.content.toLowerCase().includes(q));
    }

    // Date range
    if (startDate) {
      const start = new Date(startDate).getTime();
      result = result.filter(
        (p) => (p.scheduledAt ?? p._creationTime) >= start
      );
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + DAY - 1;
      result = result.filter(
        (p) => (p.scheduledAt ?? p._creationTime) <= end
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = a.scheduledAt ?? a._creationTime;
        const dateB = b.scheduledAt ?? b._creationTime;
        return dateB - dateA;
      }
      if (sortBy === "platform") {
        return (a.platforms[0] ?? "").localeCompare(b.platforms[0] ?? "");
      }
      // status
      return a.status.localeCompare(b.status);
    });

    return result;
  }, [
    rawPosts,
    platformFilter,
    statusFilter,
    statusPreset,
    searchQuery,
    startDate,
    endDate,
    sortBy,
  ]);

  // Selection helpers
  const allSelected =
    filteredPosts.length > 0 &&
    filteredPosts.every((p) => selectedIds.has(p._id));
  const someSelected = filteredPosts.some((p) => selectedIds.has(p._id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPosts.map((p) => p._id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const selectedCount = [...selectedIds].filter((id) =>
    filteredPosts.some((p) => p._id === id)
  ).length;

  // Action handlers
  function handleEdit(id: string) {
    // TODO: Navigate to post editor
    console.log("Edit post:", id);
  }

  async function handleDuplicate(id: string) {
    try {
      await duplicatePost({ postId: id as Id<"posts"> });
      toast.success("Post duplicated. A new draft has been created.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to duplicate post."
      );
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await removePost({ postId: id as Id<"posts"> });
      toast.success("Post deleted.");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete post."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds].filter((id) =>
      filteredPosts.some((p) => p._id === id)
    );
    if (ids.length === 0) return;
    try {
      await Promise.all(
        ids.map((id) => removePost({ postId: id as Id<"posts"> }))
      );
      toast.success(`${ids.length} post${ids.length > 1 ? "s" : ""} deleted.`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete posts."
      );
    }
  }

  function handleBulkReschedule() {
    const ids = [...selectedIds].filter((id) =>
      filteredPosts.some((p) => p._id === id)
    );
    if (ids.length === 0) return;
    setReschedulePostIds(ids);
    setRescheduleModalOpen(true);
  }

  function handleReschedule(id: string) {
    setReschedulePostIds([id]);
    setRescheduleModalOpen(true);
  }

  async function handleRescheduleConfirm(postIds: string[], scheduledAt: number) {
    try {
      await Promise.all(
        postIds.map((id) => reschedulePost({ postId: id as Id<"posts">, scheduledAt }))
      );
      toast.success(`${postIds.length} post${postIds.length > 1 ? "s" : ""} rescheduled.`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reschedule.");
      throw err; // re-throw so modal can show error
    }
  }
  async function handleBulkDuplicate() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    try {
      await Promise.all(
        ids.map((id) => duplicatePost({ postId: id as Id<"posts"> }))
      );
      toast.success(
        `${ids.length} draft${ids.length > 1 ? "s" : ""} created.`
      );
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to duplicate posts."
      );
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return <ListSkeleton rows={6} />;
  }

  return (
    <div className="flex flex-col">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        {/* Search */}
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters row: Platform, Status, Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Platform filter */}
          <PlatformMultiSelect
            selected={platformFilter}
            onChange={setPlatformFilter}
          />

          {/* Status filter (hidden when a preset is active from tabs) */}
          {!statusPreset && (
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as PostStatus | "all")
                }
                className="min-h-[44px] appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:min-h-0"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          )}

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="min-h-[44px] appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:min-h-0"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Date range -- hidden on mobile, shown on sm+ */}
        <div className="hidden items-center gap-2 sm:flex">
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              title="Start date"
            />
          </div>
          <span className="text-xs text-gray-400">to</span>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              title="End date"
            />
          </div>
        </div>
      </div>

      {/* ── Select-all row ───────────────────────────────────────────────── */}
      <div className="mt-4 flex items-center gap-3 px-4 pb-1 text-xs text-gray-500">
        <button
          type="button"
          onClick={toggleSelectAll}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700"
          title={allSelected ? "Deselect all" : "Select all"}
        >
          {allSelected ? (
            <CheckSquare className="h-4 w-4 text-indigo-600" />
          ) : someSelected ? (
            <MinusSquare className="h-4 w-4 text-indigo-600" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          <span>{allSelected ? "Deselect all" : "Select all"}</span>
        </button>
        <span className="text-gray-300">|</span>
        <span>
          {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Post rows ────────────────────────────────────────────────────── */}
      <div className="mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {filteredPosts.length === 0 ? (
          /* Empty state: distinguish between "no posts at all" and "no filter results" */
          rawPosts.length === 0 && !searchQuery && platformFilter.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No posts yet"
              description="Create your first post to start scheduling and publishing content across your social media accounts."
              actionLabel="Create Post"
              actionHref="/dashboard/posts/new"
            />
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <Search className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-4 text-sm font-medium text-gray-500">
                No posts found
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Try adjusting your filters or search query.
              </p>
            </div>
          )
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredPosts.map((post) => {
              const isSelected = selectedIds.has(post._id);
              const displayDate = post.scheduledAt ?? post._creationTime;
              const isDeleting = deletingId === post._id;

              return (
                <li
                  key={post._id}
                  className={cn(
                    "group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-start sm:gap-4",
                    isSelected && "bg-indigo-50/40",
                    isDeleting && "opacity-50 pointer-events-none"
                  )}
                >
                  {/* Top row on mobile: checkbox + status + actions */}
                  <div className="flex items-center gap-3 sm:contents">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelect(post._id)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center text-gray-400 hover:text-indigo-600 sm:mt-0.5 sm:h-auto sm:w-auto"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4.5 w-4.5 text-indigo-600" />
                      ) : (
                        <Square className="h-4.5 w-4.5" />
                      )}
                    </button>

                    {/* Status badge */}
                    <div className="shrink-0 sm:mt-0.5">
                      <StatusBadge status={post.status} />
                    </div>

                    {/* Mobile-only spacer to push actions right */}
                    <div className="flex-1 sm:hidden" />

                    {/* Actions -- visible on mobile, hover-only on desktop */}
                    <div className="flex shrink-0 items-center gap-1 sm:order-last sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleEdit(post._id)}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 sm:h-auto sm:w-auto sm:p-1.5"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(post._id)}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 sm:h-auto sm:w-auto sm:p-1.5"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReschedule(post._id)}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 sm:h-8 sm:w-8"
                        title="Reschedule"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(post._id)}
                        disabled={isDeleting}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 sm:h-auto sm:w-auto sm:p-1.5 disabled:opacity-50"
                        title="Delete"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Content body */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800">
                      {truncate(post.content, 100)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {/* Platforms */}
                      <div className="flex items-center gap-1">
                        {post.platforms.map((p: string) => (
                          <PlatformBadge key={p} platform={p} />
                        ))}
                      </div>

                      {/* Separator */}
                      <span className="text-gray-300">|</span>

                      {/* Date */}
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {displayDate
                          ? formatRelative(displayDate)
                          : "No date set"}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Bulk action bar ──────────────────────────────────────────────── */}
      {selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-indigo-500 bg-indigo-600 shadow-lg lg:left-64">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">
                {selectedCount} selected
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-indigo-200 underline underline-offset-2 hover:text-white"
              >
                Deselect all
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkReschedule}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 sm:flex-initial sm:min-h-0"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Reschedule</span>
                <span className="sm:hidden">Resched.</span>
              </button>
              <button
                type="button"
                onClick={handleBulkDuplicate}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 sm:flex-initial sm:min-h-0"
              >
                <Copy className="h-4 w-4" />
                <span>Duplicate</span>
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 sm:flex-initial sm:min-h-0"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reschedule Modal ─────────────────────────────────────────────── */}
      <RescheduleModal
        open={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false);
          setReschedulePostIds([]);
        }}
        postIds={reschedulePostIds}
        onReschedule={handleRescheduleConfirm}
      />
    </div>
  );
}
