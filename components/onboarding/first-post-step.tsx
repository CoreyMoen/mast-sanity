/**
 * FirstPostStep — Fourth step of the onboarding wizard.
 *
 * A simplified composer that lets the user create their first draft post.
 * Much simpler than the full PostComposer; just a textarea, platform
 * toggles, and a save button.
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "text-pink-600", bgActive: "bg-pink-50", borderActive: "border-pink-300" },
  { id: "facebook", label: "Facebook", color: "text-blue-600", bgActive: "bg-blue-50", borderActive: "border-blue-300" },
  { id: "twitter", label: "X / Twitter", color: "text-sky-500", bgActive: "bg-sky-50", borderActive: "border-sky-300" },
  { id: "linkedin", label: "LinkedIn", color: "text-blue-700", bgActive: "bg-slate-50", borderActive: "border-slate-300" },
] as const;

export function FirstPostStep() {
  const createPost = useMutation(api.posts.create);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 120)}px`;
  }, [content]);

  const togglePlatform = useCallback((platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId],
    );
  }, []);

  const handleSaveDraft = async () => {
    if (isSubmitting || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createPost({
        content: content.trim(),
        platforms: selectedPlatforms,
        mediaIds: [],
        hashtags: [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: "draft",
      });

      setSaved(true);
    } catch (err) {
      console.error("Failed to save draft:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save draft.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (saved) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Draft saved!
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          You can find it in your Posts section and publish it whenever
          you&apos;re ready.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Prompt */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <PenTool className="h-4 w-4 text-indigo-500" />
        Write your first post -- it will be saved as a draft.
      </div>

      {/* Textarea */}
      <div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What would you like to share with your audience?"
          className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          rows={4}
        />
        <p className="mt-1 text-xs text-gray-400">
          {content.length} characters
        </p>
      </div>

      {/* Platform toggles */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Platforms{" "}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PLATFORMS.map((platform) => {
            const selected = selectedPlatforms.includes(platform.id);
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => togglePlatform(platform.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all",
                  selected
                    ? cn(platform.bgActive, platform.borderActive, platform.color)
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                {platform.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={!content.trim() || isSubmitting}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700",
            (!content.trim() || isSubmitting) &&
              "cursor-not-allowed opacity-50",
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save as Draft"
          )}
        </button>
      </div>
    </div>
  );
}
