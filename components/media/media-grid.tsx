"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  Film,
  FileText,
  Eye,
  Trash2,
  Copy,
  Check,
  Tag,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { Id } from "@/convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MediaItem {
  _id: Id<"media">;
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

interface MediaGridProps {
  items: MediaItem[];
  viewMode: "grid" | "list";
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onView: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onCopyUrl: (url: string) => void;
  isLoading?: boolean;
  onUploadClick?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-gray-200 bg-white"
        >
          <div className="aspect-square rounded-t-lg bg-gray-200" />
          <div className="p-2.5 space-y-2">
            <div className="h-3 w-3/4 rounded bg-gray-200" />
            <div className="h-2.5 w-1/2 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
        >
          <div className="h-10 w-10 rounded bg-gray-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 rounded bg-gray-200" />
            <div className="h-2.5 w-1/5 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Individual card (grid mode) ─────────────────────────────────────────────

function MediaCard({
  item,
  isSelected,
  onToggleSelect,
  onView,
  onDelete,
  onCopyUrl,
}: {
  item: MediaItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onDelete: () => void;
  onCopyUrl: (url: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isImage = item.mimeType.startsWith("image/");
  const isVideo = item.mimeType.startsWith("video/");
  const fileIconClassName = "h-10 w-10 text-gray-300";
  const renderFileIcon = () => {
    if (item.mimeType.startsWith("image/")) return <ImageIcon className={fileIconClassName} />;
    if (item.mimeType.startsWith("video/")) return <Film className={fileIconClassName} />;
    return <FileText className={fileIconClassName} />;
  };

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.url) {
        onCopyUrl(item.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    },
    [item.url, onCopyUrl],
  );

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-white transition-all",
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-200"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail area */}
      <div
        className="relative aspect-square cursor-pointer overflow-hidden bg-gray-100"
        onClick={onView}
      >
        {isImage && item.url ? (
          <Image
            src={item.url}
            alt={item.filename}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            unoptimized
          />
        ) : isVideo && item.url ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-900">
            <Film className="h-10 w-10 text-gray-400" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {renderFileIcon()}
          </div>
        )}

        {/* Hover overlay with actions */}
        {hovered && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="rounded-full bg-white/90 p-2 text-gray-700 shadow transition-colors hover:bg-white"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full bg-white/90 p-2 text-gray-700 shadow transition-colors hover:bg-white"
              title="Copy URL"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded-full bg-white/90 p-2 text-red-600 shadow transition-colors hover:bg-white"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Selection checkbox -- always visible on mobile (no hover) */}
        <div
          className={cn(
            "absolute left-2 top-2 z-10",
            "opacity-100 sm:opacity-0",
            (hovered || isSelected) && "sm:opacity-100",
          )}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
              isSelected
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-white bg-white/80 text-transparent hover:border-indigo-400",
            )}
          >
            {isSelected && <Check className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Info section */}
      <div className="p-2.5">
        <p className="truncate text-xs font-medium text-gray-800">
          {item.filename}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
          <span>{formatFileSize(item.fileSize)}</span>
          <span>&middot;</span>
          <span>{formatDate(item.uploadedAt)}</span>
        </div>
        {item.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
              >
                <Tag className="h-2 w-2" />
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[10px] text-gray-400">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Individual row (list mode) ──────────────────────────────────────────────

function MediaRow({
  item,
  isSelected,
  onToggleSelect,
  onView,
  onDelete,
  onCopyUrl,
}: {
  item: MediaItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onDelete: () => void;
  onCopyUrl: (url: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isImage = item.mimeType.startsWith("image/");
  const renderRowIcon = () => {
    if (item.mimeType.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-gray-400" />;
    if (item.mimeType.startsWith("video/")) return <Film className="h-5 w-5 text-gray-400" />;
    return <FileText className="h-5 w-5 text-gray-400" />;
  };

  const handleCopy = useCallback(() => {
    if (item.url) {
      onCopyUrl(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [item.url, onCopyUrl]);

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-lg border bg-white px-4 py-3 transition-all",
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-200"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
      )}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggleSelect}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
          isSelected
            ? "border-indigo-600 bg-indigo-600 text-white"
            : "border-gray-300 text-transparent hover:border-indigo-400",
        )}
      >
        {isSelected && <Check className="h-3 w-3" />}
      </button>

      {/* Thumbnail */}
      <div
        className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded bg-gray-100"
        onClick={onView}
      >
        {isImage && item.url ? (
          <Image
            src={item.url}
            alt={item.filename}
            fill
            className="object-cover"
            sizes="40px"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {renderRowIcon()}
          </div>
        )}
      </div>

      {/* Info */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={onView}
      >
        <p className="truncate text-sm font-medium text-gray-800">
          {item.filename}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{formatFileSize(item.fileSize)}</span>
          {item.width && item.height && (
            <>
              <span>&middot;</span>
              <span>
                {item.width} x {item.height}
              </span>
            </>
          )}
          <span>&middot;</span>
          <span>{formatDate(item.uploadedAt)}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        {item.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
          >
            {tag}
          </span>
        ))}
        {item.tags.length > 2 && (
          <span className="text-[10px] text-gray-400">
            +{item.tags.length - 2}
          </span>
        )}
      </div>

      {/* Actions -- always visible on mobile, hover-only on desktop */}
      <div className="flex shrink-0 items-center gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={onView}
          className="flex h-11 w-11 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 sm:h-auto sm:w-auto sm:p-1.5"
          title="View"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-11 w-11 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 sm:h-auto sm:w-auto sm:p-1.5"
          title="Copy URL"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onDelete()}
          className="flex h-11 w-11 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600 sm:h-auto sm:w-auto sm:p-1.5"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function MediaGrid({
  items,
  viewMode,
  selectedIds,
  onToggleSelect,
  onView,
  onDelete,
  onCopyUrl,
  isLoading,
  onUploadClick,
}: MediaGridProps) {
  if (isLoading) {
    return viewMode === "grid" ? <GridSkeleton /> : <ListSkeleton />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="No media files yet"
        description="Upload images, videos, or documents to build your media library and use them in posts."
        actionLabel="Upload Files"
        onAction={onUploadClick}
      />
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <MediaRow
            key={item._id}
            item={item}
            isSelected={selectedIds.has(item._id)}
            onToggleSelect={() => onToggleSelect(item._id)}
            onView={() => onView(item)}
            onDelete={() => onDelete(item)}
            onCopyUrl={onCopyUrl}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => (
        <MediaCard
          key={item._id}
          item={item}
          isSelected={selectedIds.has(item._id)}
          onToggleSelect={() => onToggleSelect(item._id)}
          onView={() => onView(item)}
          onDelete={() => onDelete(item)}
          onCopyUrl={onCopyUrl}
        />
      ))}
    </div>
  );
}
