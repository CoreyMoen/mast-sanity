"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useMutation } from "convex/react";
import {
  X,
  Copy,
  Check,
  Trash2,
  Tag,
  Image as ImageIcon,
  Film,
  FileText,
  Download,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import type { MediaItem } from "./media-grid";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface MediaDetailProps {
  item: MediaItem;
  onClose: () => void;
  onDelete: (item: MediaItem) => void;
  onUseInPost?: (url: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MediaDetail({
  item,
  onClose,
  onDelete,
  onUseInPost,
}: MediaDetailProps) {
  const [copied, setCopied] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [editingFilename, setEditingFilename] = useState(false);
  const [filenameValue, setFilenameValue] = useState(item.filename);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateMedia = useMutation(api.media.update);
  const addTagMutation = useMutation(api.media.addTag);
  const removeTagMutation = useMutation(api.media.removeTag);

  const isImage = item.mimeType.startsWith("image/");
  const isVideo = item.mimeType.startsWith("video/");

  const handleCopyUrl = useCallback(() => {
    if (item.url) {
      navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [item.url]);

  const handleAddTag = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const tag = newTag.trim().toLowerCase();
      if (!tag) return;
      try {
        await addTagMutation({ mediaId: item._id, tag });
        setNewTag("");
      } catch (error) {
        console.error("Failed to add tag:", error);
      }
    },
    [addTagMutation, item._id, newTag],
  );

  const handleRemoveTag = useCallback(
    async (tag: string) => {
      try {
        await removeTagMutation({ mediaId: item._id, tag });
      } catch (error) {
        console.error("Failed to remove tag:", error);
      }
    },
    [removeTagMutation, item._id],
  );

  const handleSaveFilename = useCallback(async () => {
    const trimmed = filenameValue.trim();
    if (!trimmed || trimmed === item.filename) {
      setEditingFilename(false);
      setFilenameValue(item.filename);
      return;
    }
    try {
      await updateMedia({ mediaId: item._id, filename: trimmed });
      setEditingFilename(false);
    } catch (error) {
      console.error("Failed to update filename:", error);
    }
  }, [updateMedia, item._id, item.filename, filenameValue]);

  const handleDelete = useCallback(() => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(item);
  }, [confirmDelete, item, onDelete]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel -- full-screen on mobile, side panel on larger screens */}
      <div className="fixed inset-0 z-50 flex flex-col bg-white shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:w-full sm:max-w-lg sm:border-l sm:border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Media Detail</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Preview */}
          <div className="bg-gray-100 p-4">
            <div className="flex items-center justify-center overflow-hidden rounded-lg bg-gray-50">
              {isImage && item.url ? (
                <div className="relative w-full" style={{ height: "20rem" }}>
                  <Image
                    src={item.url}
                    alt={item.filename}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, 512px"
                    unoptimized
                  />
                </div>
              ) : isVideo && item.url ? (
                <video
                  src={item.url}
                  controls
                  className="max-h-80 w-full"
                  preload="metadata"
                >
                  <track kind="captions" />
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-16 w-16 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-400">
                    Preview not available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-6 p-6">
            {/* Filename */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Filename
              </label>
              {editingFilename ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filenameValue}
                    onChange={(e) => setFilenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveFilename();
                      if (e.key === "Escape") {
                        setEditingFilename(false);
                        setFilenameValue(item.filename);
                      }
                    }}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveFilename}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p
                  className="cursor-pointer truncate text-sm text-gray-900 hover:text-indigo-600"
                  onClick={() => setEditingFilename(true)}
                  title="Click to edit"
                >
                  {item.filename}
                </p>
              )}
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                  Type
                </label>
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  {isImage && <ImageIcon className="h-3.5 w-3.5" />}
                  {isVideo && <Film className="h-3.5 w-3.5" />}
                  {!isImage && !isVideo && (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  {item.mimeType}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                  File size
                </label>
                <p className="text-sm text-gray-700">
                  {formatFileSize(item.fileSize)}
                </p>
              </div>

              {item.width && item.height && (
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                    Dimensions
                  </label>
                  <p className="text-sm text-gray-700">
                    {item.width} x {item.height} px
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                  Uploaded
                </label>
                <p className="text-sm text-gray-700">
                  {formatDateTime(item.uploadedAt)}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
                Tags
              </label>

              {/* Existing tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-0.5 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add tag form */}
              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newTag.trim()}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    newTag.trim()
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed",
                  )}
                >
                  Add
                </button>
              </form>
            </div>

            {/* URL section */}
            {item.url && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                  URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={item.url}
                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {/* Use in Post */}
            {onUseInPost && item.url && (
              <button
                type="button"
                onClick={() => onUseInPost(item.url!)}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                <ExternalLink className="h-4 w-4" />
                Use in Post
              </button>
            )}

            {/* Download */}
            {item.url && (
              <a
                href={item.url}
                download={item.filename}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            )}

            {/* Delete */}
            <button
              type="button"
              onClick={handleDelete}
              className={cn(
                "flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                confirmDelete
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "border border-red-200 text-red-600 hover:bg-red-50",
              )}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? "Confirm Delete" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
