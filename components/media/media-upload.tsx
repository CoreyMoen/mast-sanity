"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { Upload, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];
const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
];
const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const ALL_ACCEPTED = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_VIDEO_TYPES,
  ...ACCEPTED_DOC_TYPES,
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface MediaUploadProps {
  onUploadComplete?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateFile(file: File): string | null {
  if (!ALL_ACCEPTED.includes(file.type)) {
    return `Unsupported file type: ${file.type || "unknown"}`;
  }

  const isVideo = file.type.startsWith("video/");
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  const maxLabel = isVideo ? "100 MB" : "10 MB";

  if (file.size > maxSize) {
    return `File too large (max ${maxLabel})`;
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

export function MediaUpload({ onUploadComplete }: MediaUploadProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const uploadMedia = useMutation(api.media.upload);

  const updateUpload = useCallback(
    (id: string, update: Partial<UploadItem>) => {
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...update } : u)),
      );
    },
    [],
  );

  const processFile = useCallback(
    async (item: UploadItem) => {
      updateUpload(item.id, { status: "uploading", progress: 0 });

      try {
        // 1. Get upload URL
        updateUpload(item.id, { progress: 10 });
        const uploadUrl = await generateUploadUrl();

        // 2. Upload file to Convex storage
        updateUpload(item.id, { progress: 30 });

        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": item.file.type },
          body: item.file,
        });

        if (!result.ok) {
          throw new Error(`Upload failed: ${result.statusText}`);
        }

        const { storageId } = await result.json();
        updateUpload(item.id, { progress: 70 });

        // 3. Get image dimensions if applicable
        const dimensions = await getImageDimensions(item.file);
        updateUpload(item.id, { progress: 85 });

        // 4. Save media metadata
        await uploadMedia({
          storageId,
          filename: item.file.name,
          mimeType: item.file.type,
          fileSize: item.file.size,
          width: dimensions?.width,
          height: dimensions?.height,
        });

        updateUpload(item.id, { progress: 100, status: "done" });
      } catch (error) {
        console.error("Upload error:", error);
        updateUpload(item.id, {
          status: "error",
          error:
            error instanceof Error ? error.message : "Upload failed",
        });
      }
    },
    [generateUploadUrl, uploadMedia, updateUpload],
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newItems: UploadItem[] = [];

      for (const file of fileArray) {
        const validationError = validateFile(file);
        const item: UploadItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          progress: 0,
          status: validationError ? "error" : "pending",
          error: validationError ?? undefined,
        };
        newItems.push(item);
      }

      setUploads((prev) => [...newItems, ...prev]);

      // Start uploading valid files
      for (const item of newItems) {
        if (item.status === "pending") {
          processFile(item).then(() => {
            onUploadComplete?.();
          });
        }
      }
    },
    [processFile, onUploadComplete],
  );

  // ─── Drag handlers ──────────────────────────────────────────────────────────

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

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [handleFiles],
  );

  const removeItem = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status !== "done"));
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  const hasCompleted = uploads.some((u) => u.status === "done");
  const activeUploads = uploads.filter(
    (u) => u.status === "uploading" || u.status === "pending",
  );

  return (
    <div className="space-y-4">
      {/* Drop zone */}
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
          {isDragOver ? "Drop files here" : "Upload images, video, or documents"}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Drag and drop or click to browse. Images up to 10 MB, videos up to
          100 MB.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALL_ACCEPTED.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload queue */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500">
              {activeUploads.length > 0
                ? `Uploading ${activeUploads.length} file${activeUploads.length !== 1 ? "s" : ""}...`
                : "Upload complete"}
            </p>
            {hasCompleted && (
              <button
                type="button"
                onClick={clearCompleted}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Clear completed
              </button>
            )}
          </div>

          {uploads.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              {/* Status icon */}
              {item.status === "uploading" && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-600" />
              )}
              {item.status === "done" && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              )}
              {item.status === "error" && (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              )}
              {item.status === "pending" && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />
              )}

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-gray-700">
                  {item.file.name}
                </p>
                {item.error ? (
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

              {/* Progress text */}
              {item.status === "uploading" && (
                <span className="shrink-0 text-xs font-medium text-indigo-600">
                  {item.progress}%
                </span>
              )}

              {/* Remove button */}
              {(item.status === "done" || item.status === "error") && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
