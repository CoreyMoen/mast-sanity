"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Image as ImageIcon,
  Film,
  FileText,
  Upload,
  Search,
  Tag,
  Trash2,
  Grid,
  List,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { MediaGrid } from "@/components/media/media-grid";
import { MediaUpload } from "@/components/media/media-upload";
import { MediaDetail } from "@/components/media/media-detail";
import type { MediaItem } from "@/components/media/media-grid";
import type { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/ui/toast";

// ─── Constants ───────────────────────────────────────────────────────────────

type FileTypeFilter = "all" | "image" | "video" | "document";

const FILE_TYPE_TABS: { value: FileTypeFilter; label: string; icon: typeof ImageIcon }[] = [
  { value: "all", label: "All", icon: Grid },
  { value: "image", label: "Images", icon: ImageIcon },
  { value: "video", label: "Videos", icon: Film },
  { value: "document", label: "Documents", icon: FileText },
];

// Map filter value to MIME type prefix for the backend query
function getMimeFilter(filter: FileTypeFilter): string | undefined {
  switch (filter) {
    case "image":
      return "image";
    case "video":
      return "video";
    case "document":
      return "application";
    default:
      return undefined;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MediaPage() {
  const toast = useToast();

  // ── View state ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // ── Selection state ────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Detail panel state ─────────────────────────────────────────────────────
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);

  // ── Bulk tag state ─────────────────────────────────────────────────────────
  const [showBulkTag, setShowBulkTag] = useState(false);
  const [bulkTagValue, setBulkTagValue] = useState("");

  // ── Convex queries/mutations ───────────────────────────────────────────────
  const mediaItems = useQuery(api.media.list, {
    mimeTypeFilter: getMimeFilter(fileTypeFilter),
    search: search || undefined,
    tagFilter: tagFilter ?? undefined,
  });

  const removeMutation = useMutation(api.media.remove);
  const bulkDeleteMutation = useMutation(api.media.bulkDelete);
  const bulkAddTagMutation = useMutation(api.media.bulkAddTag);

  const isLoading = mediaItems === undefined || mediaItems === null;

  // ── Collect unique tags across all items ───────────────────────────────────
  const allTags = useMemo(() => {
    if (!mediaItems) return [];
    const tagSet = new Set<string>();
    for (const item of mediaItems) {
      for (const tag of item.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [mediaItems]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!mediaItems) return;
    if (selectedIds.size === mediaItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(mediaItems.map((m) => m._id)));
    }
  }, [mediaItems, selectedIds.size]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
  }, []);

  const handleDeleteSingle = useCallback(
    async (item: MediaItem) => {
      try {
        await removeMutation({ mediaId: item._id });
        setDetailItem(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(item._id);
          return next;
        });
        toast.success("File deleted.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete file. Please try again."
        );
      }
    },
    [removeMutation, toast],
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkDeleteMutation({
        mediaIds: Array.from(selectedIds) as Id<"media">[],
      });
      toast.success(`${selectedIds.size} file${selectedIds.size > 1 ? "s" : ""} deleted.`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete files. Please try again."
      );
    }
  }, [bulkDeleteMutation, selectedIds, toast]);

  const handleBulkAddTag = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const tag = bulkTagValue.trim().toLowerCase();
      if (!tag || selectedIds.size === 0) return;
      try {
        await bulkAddTagMutation({
          mediaIds: Array.from(selectedIds) as Id<"media">[],
          tag,
        });
        toast.success(`Tag "${tag}" added to ${selectedIds.size} file${selectedIds.size > 1 ? "s" : ""}.`);
        setBulkTagValue("");
        setShowBulkTag(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to add tag. Please try again."
        );
      }
    },
    [bulkAddTagMutation, bulkTagValue, selectedIds, toast],
  );

  const handleUseInPost = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    setDetailItem(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const hasSelection = selectedIds.size > 0;
  const allSelected =
    mediaItems !== undefined &&
    mediaItems !== null &&
    mediaItems.length > 0 &&
    selectedIds.size === mediaItems.length;

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <ImageIcon className="h-7 w-7 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Media Library
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Upload, organize, and manage your media assets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUpload((v) => !v)}
          className={cn(
            "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto",
            showUpload
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-indigo-600 text-white hover:bg-indigo-700",
          )}
        >
          <Upload className="h-4 w-4" />
          {showUpload ? "Hide Upload" : "Upload Files"}
        </button>
      </div>

      {/* ── Upload area ─────────────────────────────────────────────────── */}
      {showUpload && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <MediaUpload onUploadComplete={() => {}} />
        </div>
      )}

      {/* ── Toolbar: search, filters, view toggle ───────────────────────── */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by filename..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "grid"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              <Grid className="h-3.5 w-3.5" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "list"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>
        </div>

        {/* File type tabs */}
        <div className="flex items-center gap-4 overflow-x-auto border-b border-gray-200 sm:gap-6">
          {FILE_TYPE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = fileTypeFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFileTypeFilter(tab.value)}
                className={cn(
                  "flex min-h-[44px] items-center gap-1.5 whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors sm:min-h-0",
                  isActive
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400">Tags:</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setTagFilter((prev) => (prev === tag ? null : tag))
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  tagFilter === tag
                    ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
                {tagFilter === tag && <X className="h-2.5 w-2.5 ml-0.5" />}
              </button>
            ))}
            {tagFilter && (
              <button
                type="button"
                onClick={() => setTagFilter(null)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Bulk action bar ─────────────────────────────────────────────── */}
      {hasSelection && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                allSelected
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-indigo-400 bg-white text-transparent hover:border-indigo-500",
              )}
            >
              {allSelected && <Check className="h-3 w-3" />}
            </button>

            <span className="text-sm font-medium text-indigo-700">
              {selectedIds.size} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {/* Add tags */}
            {showBulkTag ? (
              <form
                onSubmit={handleBulkAddTag}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={bulkTagValue}
                  onChange={(e) => setBulkTagValue(e.target.value)}
                  placeholder="Tag name..."
                  className="w-28 rounded-md border border-indigo-300 bg-white px-2.5 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-36"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!bulkTagValue.trim()}
                  className="min-h-[36px] rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkTag(false);
                    setBulkTagValue("");
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-indigo-400 hover:text-indigo-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowBulkTag(true)}
                className="flex min-h-[44px] items-center gap-1.5 rounded-md border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 sm:min-h-0"
              >
                <Tag className="h-3 w-3" />
                Add Tag
              </button>
            )}

            {/* Delete selected */}
            <button
              type="button"
              onClick={handleBulkDelete}
              className="flex min-h-[44px] items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 sm:min-h-0"
            >
              <Trash2 className="h-3 w-3" />
              Delete ({selectedIds.size})
            </button>

            {/* Clear selection */}
            <button
              type="button"
              onClick={handleClearSelection}
              className="flex h-11 w-11 items-center justify-center rounded-md text-indigo-400 transition-colors hover:bg-indigo-100 hover:text-indigo-600 sm:h-auto sm:w-auto sm:p-1.5"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Media grid/list ─────────────────────────────────────────────── */}
      <div className="mt-6 pb-20">
        <MediaGrid
          items={(mediaItems as MediaItem[] | undefined) ?? []}
          viewMode={viewMode}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onView={setDetailItem}
          onDelete={handleDeleteSingle}
          onCopyUrl={handleCopyUrl}
          isLoading={isLoading}
          onUploadClick={() => setShowUpload(true)}
        />
      </div>

      {/* ── Detail panel ────────────────────────────────────────────────── */}
      {detailItem && (
        <MediaDetail
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onDelete={handleDeleteSingle}
          onUseInPost={handleUseInPost}
        />
      )}
    </div>
  );
}
