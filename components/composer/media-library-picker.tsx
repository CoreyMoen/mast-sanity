"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import {
  X,
  Search,
  Image as ImageIcon,
  Film,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { AttachedMedia } from "./media-attachments";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Shape of a media record returned from the Convex media.list query */
interface MediaListItem {
  _id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  tags: string[];
  uploadedAt: number;
  url: string | null;
  thumbnailUrl?: string | null;
}

interface MediaLibraryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called for each selected media item when user confirms */
  onSelect: (items: AttachedMedia[]) => void;
  /** IDs already attached so we can disable them */
  alreadyAttachedIds: Set<string>;
  /** Max items that can still be added */
  maxSelectable: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MediaLibraryPicker({
  isOpen,
  onClose,
  onSelect,
  alreadyAttachedIds,
  maxSelectable,
}: MediaLibraryPickerProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">(
    "all",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch user's media from Convex
  const mediaItems = useQuery(api.media.list, {
    mimeTypeFilter:
      typeFilter === "image"
        ? "image"
        : typeFilter === "video"
          ? "video"
          : undefined,
    search: search.trim() || undefined,
    limit: 100,
  });

  const isLoading = mediaItems === undefined || mediaItems === null;

  // Filter out non-image/video items since the composer only supports those
  const filteredItems = useMemo((): MediaListItem[] => {
    if (!mediaItems) return [];
    return (mediaItems as MediaListItem[]).filter(
      (item: MediaListItem) =>
        item.mimeType.startsWith("image/") ||
        item.mimeType.startsWith("video/"),
    );
  }, [mediaItems]);

  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (next.size >= maxSelectable) return prev;
          next.add(id);
        }
        return next;
      });
    },
    [maxSelectable],
  );

  const handleConfirm = useCallback(() => {
    if (!mediaItems) return;
    const selected: AttachedMedia[] = [];
    for (const item of mediaItems as MediaListItem[]) {
      if (selectedIds.has(item._id)) {
        selected.push({
          mediaId: item._id as Id<"media">,
          url: item.url,
          filename: item.filename,
          mimeType: item.mimeType,
        });
      }
    }
    onSelect(selected);
    setSelectedIds(new Set());
    onClose();
  }, [mediaItems, selectedIds, onSelect, onClose]);

  const handleClose = useCallback(() => {
    setSelectedIds(new Set());
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-4 z-50 mx-auto flex max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:inset-y-8 sm:inset-x-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Media Library
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar: search + type filter */}
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by filename..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "image", "video"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTypeFilter(filter)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  typeFilter === filter
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {filter === "all"
                  ? "All"
                  : filter === "image"
                    ? "Images"
                    : "Videos"}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ImageIcon className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                {search
                  ? "No media found matching your search."
                  : "No media files in your library yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {filteredItems.map((item) => {
                const isAlreadyAttached = alreadyAttachedIds.has(item._id);
                const isSelected = selectedIds.has(item._id);
                const isImage = item.mimeType.startsWith("image/");
                const isVideo = item.mimeType.startsWith("video/");
                const canSelect =
                  !isAlreadyAttached &&
                  (isSelected || selectedIds.size < maxSelectable);

                return (
                  <button
                    key={item._id}
                    type="button"
                    disabled={isAlreadyAttached}
                    onClick={() => {
                      if (!isAlreadyAttached) toggleSelect(item._id);
                    }}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-lg border-2 bg-gray-100 transition-all",
                      isAlreadyAttached
                        ? "cursor-not-allowed border-gray-200 opacity-50"
                        : isSelected
                          ? "border-indigo-500 ring-2 ring-indigo-200"
                          : canSelect
                            ? "cursor-pointer border-gray-200 hover:border-gray-300"
                            : "cursor-not-allowed border-gray-200 opacity-60",
                    )}
                  >
                    {/* Thumbnail */}
                    {isImage && item.url ? (
                      <Image
                        src={item.url}
                        alt={item.filename}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                        unoptimized
                      />
                    ) : isVideo ? (
                      <div className="flex h-full w-full items-center justify-center bg-gray-900">
                        <Film className="h-8 w-8 text-gray-400" />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                      </div>
                    )}

                    {/* Selection indicator */}
                    <div className="absolute left-1.5 top-1.5">
                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                          isAlreadyAttached
                            ? "border-gray-400 bg-gray-400 text-white"
                            : isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-white bg-white/80 text-transparent",
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                    </div>

                    {/* Filename on hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1 pt-4 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate text-[10px] font-medium text-white">
                        {item.filename}
                      </p>
                      <p className="text-[9px] text-gray-300">
                        {formatFileSize(item.fileSize)}
                      </p>
                    </div>

                    {/* "Already attached" badge */}
                    {isAlreadyAttached && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                        <span className="rounded-full bg-gray-700/80 px-2 py-0.5 text-[10px] font-medium text-white">
                          Attached
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : maxSelectable > 0
                ? `Select up to ${maxSelectable} more`
                : "Maximum files reached"}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:min-h-0 sm:flex-initial"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleConfirm}
              className={cn(
                "min-h-[44px] flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors sm:min-h-0 sm:flex-initial",
                selectedIds.size > 0
                  ? "hover:bg-indigo-700"
                  : "cursor-not-allowed opacity-50",
              )}
            >
              Attach {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
