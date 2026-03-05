"use client";

import { useState, useRef, useCallback } from "react";
import NextImage from "next/image";
import { useMutation } from "convex/react";
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Film,
  ImagePlus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_ATTACHMENTS = 10;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];
const ALL_ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];

const ACCEPT_STRING = ALL_ACCEPTED_TYPES.join(",");

// ─── Types ───────────────────────────────────────────────────────────────────

interface UploadingFile {
  /** Client-side unique id for tracking */
  localId: string;
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
  /** Set once the upload + metadata save is complete */
  mediaId?: Id<"media">;
  /** Local object URL for thumbnail preview */
  previewUrl: string;
}

export interface AttachedMedia {
  mediaId: Id<"media">;
  url: string | null;
  filename: string;
  mimeType: string;
}

interface MediaAttachmentsProps {
  /** Currently attached media IDs (the source of truth the parent owns) */
  attachedMedia: AttachedMedia[];
  /** Called when media is added (after upload completes or library pick) */
  onAttach: (media: AttachedMedia) => void;
  /** Called when a media attachment is removed */
  onRemove: (mediaId: Id<"media">) => void;
  /** Opens the media library picker */
  onOpenLibrary: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateFile(file: File): string | null {
  if (!ALL_ACCEPTED_TYPES.includes(file.type)) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "unknown";
    return `Unsupported file type (.${ext}). Accepted: JPG, PNG, GIF, WebP, MP4, MOV.`;
  }

  const isVideo = file.type.startsWith("video/");
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  const maxLabel = isVideo ? "100 MB" : "10 MB";

  if (file.size > maxSize) {
    return `File too large (max ${maxLabel}).`;
  }

  return null;
}

function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MediaAttachments({
  attachedMedia,
  onAttach,
  onRemove,
  onOpenLibrary,
}: MediaAttachmentsProps) {
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const uploadMedia = useMutation(api.media.upload);

  const totalCount = attachedMedia.length + uploads.filter((u) => u.status === "uploading").length;
  const isAtLimit = totalCount >= MAX_ATTACHMENTS;

  // ─── Upload a single file ──────────────────────────────────────────────────

  const processFile = useCallback(
    async (localId: string, file: File) => {
      const update = (patch: Partial<UploadingFile>) => {
        setUploads((prev) =>
          prev.map((u) => (u.localId === localId ? { ...u, ...patch } : u)),
        );
      };

      try {
        // 1. Get signed upload URL
        update({ progress: 10 });
        const uploadUrl = await generateUploadUrl();

        // 2. Upload file to Convex storage
        update({ progress: 30 });
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error(`Upload failed: ${result.statusText}`);
        }

        const { storageId } = await result.json();
        update({ progress: 60 });

        // 3. Get image dimensions (images only)
        const dimensions = await getImageDimensions(file);
        update({ progress: 80 });

        // 4. Save media metadata to Convex
        const mediaId = await uploadMedia({
          storageId,
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
          width: dimensions?.width,
          height: dimensions?.height,
        });

        update({ progress: 100, status: "done", mediaId });

        // 5. Notify parent
        onAttach({
          mediaId,
          url: URL.createObjectURL(file), // Temporary local URL for preview
          filename: file.name,
          mimeType: file.type,
        });

        // Remove from uploads list after a short delay
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.localId !== localId));
        }, 500);
      } catch (err) {
        console.error("Upload error:", err);
        update({
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed.",
        });
      }
    },
    [generateUploadUrl, uploadMedia, onAttach],
  );

  // ─── Handle file selection ────────────────────────────────────────────────

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      // Check how many more we can accept
      const slotsAvailable = MAX_ATTACHMENTS - totalCount;
      if (slotsAvailable <= 0) {
        setError(`Maximum ${MAX_ATTACHMENTS} files allowed.`);
        return;
      }

      const toProcess = fileArray.slice(0, slotsAvailable);
      if (fileArray.length > slotsAvailable) {
        setError(
          `Only ${slotsAvailable} more file${slotsAvailable !== 1 ? "s" : ""} can be attached (max ${MAX_ATTACHMENTS}).`,
        );
      }

      for (const file of toProcess) {
        const validationError = validateFile(file);
        const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const previewUrl = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : "";

        if (validationError) {
          setUploads((prev) => [
            ...prev,
            {
              localId,
              file,
              progress: 0,
              status: "error",
              error: validationError,
              previewUrl,
            },
          ]);
        } else {
          setUploads((prev) => [
            ...prev,
            {
              localId,
              file,
              progress: 0,
              status: "uploading",
              previewUrl,
            },
          ]);
          processFile(localId, file);
        }
      }
    },
    [totalCount, processFile],
  );

  // ─── Drag-and-drop handlers ──────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      e.target.value = "";
    },
    [handleFiles],
  );

  const dismissUploadError = useCallback((localId: string) => {
    setUploads((prev) => prev.filter((u) => u.localId !== localId));
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  const hasAttachments = attachedMedia.length > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Media
      </label>

      {/* Attached media thumbnails */}
      {hasAttachments && (
        <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {attachedMedia.map((media) => {
            const isImage = media.mimeType.startsWith("image/");
            const isVideo = media.mimeType.startsWith("video/");
            return (
              <div
                key={media.mediaId}
                className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
              >
                {isImage && media.url ? (
                  <NextImage
                    src={media.url}
                    alt={media.filename}
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

                {/* Remove button overlay */}
                <button
                  type="button"
                  onClick={() => onRemove(media.mediaId)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Filename tooltip */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-[10px] font-medium text-white">
                    {media.filename}
                  </p>
                </div>
              </div>
            );
          })}

          {/* "Add more" tile (if not at limit) */}
          {!isAtLimit && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 transition-colors hover:border-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <Plus className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

      {/* Upload progress indicators */}
      {uploads.length > 0 && (
        <div className="mb-4 space-y-2">
          {uploads.map((item) => (
            <div
              key={item.localId}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              {/* Thumbnail preview */}
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
                {item.previewUrl ? (
                  <NextImage
                    src={item.previewUrl}
                    alt={item.file.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Film className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>

              {/* File info + progress */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-gray-700">
                  {item.file.name}
                </p>
                {item.status === "error" ? (
                  <p className="text-xs text-red-500">{item.error}</p>
                ) : (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        item.status === "done"
                          ? "bg-green-500"
                          : "bg-indigo-600",
                      )}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Status / actions */}
              {item.status === "uploading" && (
                <span className="shrink-0 text-xs font-medium text-indigo-600">
                  {item.progress}%
                </span>
              )}
              {item.status === "error" && (
                <button
                  type="button"
                  onClick={() => dismissUploadError(item.localId)}
                  className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {item.status === "uploading" && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-600" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone (shown when no attachments, or always as a smaller zone) */}
      {!hasAttachments && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
            isDragOver
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100",
          )}
        >
          <Upload
            className={cn(
              "h-8 w-8 mb-2",
              isDragOver ? "text-indigo-500" : "text-gray-400",
            )}
          />
          <p className="text-sm font-medium text-gray-600">
            {isDragOver ? "Drop files here" : "Upload images or video"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Drag and drop or click to browse. JPG, PNG, GIF, WebP, MP4, MOV.
          </p>
        </div>
      )}

      {/* Action row: browse files + media library */}
      {hasAttachments && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "rounded-lg border-2 border-dashed p-3 transition-colors",
            isDragOver
              ? "border-indigo-500 bg-indigo-50"
              : "border-transparent",
          )}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAtLimit}
              className={cn(
                "flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors sm:min-h-0",
                isAtLimit
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-gray-50",
              )}
            >
              <Upload className="h-4 w-4" />
              Upload More
            </button>
            <button
              type="button"
              onClick={onOpenLibrary}
              disabled={isAtLimit}
              className={cn(
                "flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors sm:min-h-0",
                isAtLimit
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-gray-50",
              )}
            >
              <ImagePlus className="h-4 w-4" />
              From Library
            </button>
          </div>
        </div>
      )}

      {/* Library button when no attachments */}
      {!hasAttachments && (
        <button
          type="button"
          onClick={onOpenLibrary}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:min-h-0"
        >
          <ImagePlus className="h-4 w-4" />
          Choose from Media Library
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPT_STRING}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Error banner */}
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto shrink-0 rounded p-0.5 text-red-400 hover:text-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* File count / limit indicator */}
      {attachedMedia.length > 0 && (
        <p className="mt-2 text-xs text-gray-400">
          {attachedMedia.length} / {MAX_ATTACHMENTS} files attached
        </p>
      )}
    </div>
  );
}
