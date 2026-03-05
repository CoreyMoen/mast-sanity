"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useAction, useQuery } from "convex/react";
import {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Clock,
  Send,
  Save,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  CheckSquare,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { remainingChars, PLATFORM_CHAR_LIMITS } from "@/lib/utils/validation";
import { getBrowserTimezone, localToUtcTimestamp } from "@/lib/utils/timezone";
import { HashtagInput } from "@/components/composer/hashtag-input";
import { PlatformPreview } from "@/components/composer/platform-preview";
import { AiCaptionPanel } from "@/components/composer/ai-caption-panel";
import { AiRewritePanel } from "@/components/composer/ai-rewrite-panel";
import { HashtagSuggestions } from "@/components/composer/hashtag-suggestions";
import { MediaAttachments, type AttachedMedia } from "@/components/composer/media-attachments";
import { MediaLibraryPicker } from "@/components/composer/media-library-picker";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/ui/toast";

// ─── Platform definitions ──────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-600", bgActive: "bg-pink-50", borderActive: "border-pink-300" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600", bgActive: "bg-blue-50", borderActive: "border-blue-300" },
  { id: "twitter", label: "X / Twitter", icon: Twitter, color: "text-sky-500", bgActive: "bg-sky-50", borderActive: "border-sky-300" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-700", bgActive: "bg-slate-50", borderActive: "border-slate-300" },
] as const;

// ─── Common timezone options ────────────────────────────────────────────────────

const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "UTC",
];

// ─── Character count color helper ───────────────────────────────────────────────

function charCountColor(remaining: number | null, limit: number): string {
  if (remaining === null) return "text-gray-400";
  if (remaining < 0) return "text-red-600 font-semibold";
  if (remaining < limit * 0.2) return "text-yellow-600";
  return "text-green-600";
}

// ─── Feedback message type ──────────────────────────────────────────────────────

type FeedbackMessage = {
  type: "success" | "error";
  text: string;
} | null;

// ─── Props ──────────────────────────────────────────────────────────────────────

interface PostComposerProps {
  /**
   * When true, the primary action changes to "Submit for Approval" instead
   * of "Post Now" / "Schedule Post". This is set when the user's role in a
   * Business-tier org requires approval (creator/editor roles).
   */
  requiresApproval?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function PostComposer({ requiresApproval = false }: PostComposerProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convex queries, mutations and actions
  const connectedAccounts = useQuery(api.socialAccounts.list);
  const createPost = useMutation(api.posts.create);
  const schedulePost = useMutation(api.scheduling.schedulePost);
  const publishNow = useAction(api.scheduling.publishNow);
  const submitForApprovalMutation = useMutation(api.approvals.submitForApproval);
  const toast = useToast();

  // ─── Local state ──────────────────────────────────────────────────────────────

  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "scheduled">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [timezone, setTimezone] = useState(() => getBrowserTimezone());
  const [activePreviewTab, setActivePreviewTab] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [showRewritePanel, setShowRewritePanel] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<AttachedMedia[]>([]);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);

  // ─── Filter platforms to only connected accounts ─────────────────────────────

  const availablePlatforms = useMemo(() => {
    if (!connectedAccounts) return [];
    const activePlatformIds = new Set(
      connectedAccounts
        .filter((a: any) => a.isActive)
        .map((a: any) => a.platform),
    );
    return PLATFORMS.filter((p) => activePlatformIds.has(p.id));
  }, [connectedAccounts]);

  // Look up connected account data for a platform (used in preview)
  const getAccountForPlatform = useCallback(
    (platformId: string) => {
      if (!connectedAccounts) return null;
      return connectedAccounts.find(
        (a: any) => a.platform === platformId && a.isActive,
      ) ?? null;
    },
    [connectedAccounts],
  );

  // ─── Auto-resize textarea ─────────────────────────────────────────────────────

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 160)}px`;
  }, [content]);

  // ─── Auto-extract hashtags from content ─────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      // Match #hashtag patterns (letters, numbers, underscores)
      const matches = content.match(/#([a-zA-Z]\w{0,49})/g);
      if (!matches || matches.length === 0) return;

      const extracted = matches.map((m) => m.slice(1).toLowerCase());
      setHashtags((prev) => {
        const existing = new Set(prev);
        const newTags = extracted.filter((tag) => !existing.has(tag));
        if (newTags.length === 0) return prev;
        return [...prev, ...newTags];
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [content]);

  // Set the first selected platform as the default preview tab
  useEffect(() => {
    if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(activePreviewTab ?? "")) {
      setActivePreviewTab(selectedPlatforms[0]);
    }
    if (selectedPlatforms.length === 0) {
      setActivePreviewTab(null);
    }
  }, [selectedPlatforms, activePreviewTab]);

  // Clear feedback after a delay
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // ─── AI panel handlers ───────────────────────────────────────────────────────

  const handleUseCaption = useCallback((caption: string) => {
    setContent(caption);
    setIsAiPanelOpen(false);
  }, []);

  const handleUseRewrite = useCallback((rewrittenText: string) => {
    setContent(rewrittenText);
    setShowRewritePanel(false);
  }, []);

  const handleAddHashtag = useCallback(
    (hashtag: string) => {
      const tag = hashtag.replace(/^#/, "").trim().toLowerCase();
      if (!tag || hashtags.includes(tag)) return;
      setHashtags((prev) => [...prev, tag]);
    },
    [hashtags],
  );

  // ─── Platform toggle ─────────────────────────────────────────────────────────

  const togglePlatform = useCallback((platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId],
    );
  }, []);

  // ─── Media handlers ──────────────────────────────────────────────────────────

  const handleMediaAttach = useCallback((media: AttachedMedia) => {
    setAttachedMedia((prev) => {
      // Prevent duplicates
      if (prev.some((m) => m.mediaId === media.mediaId)) return prev;
      return [...prev, media];
    });
  }, []);

  const handleMediaRemove = useCallback((mediaId: Id<"media">) => {
    setAttachedMedia((prev) => prev.filter((m) => m.mediaId !== mediaId));
  }, []);

  const handleLibrarySelect = useCallback((items: AttachedMedia[]) => {
    setAttachedMedia((prev) => {
      const existingIds = new Set(prev.map((m) => m.mediaId));
      const newItems = items.filter((item) => !existingIds.has(item.mediaId));
      return [...prev, ...newItems];
    });
  }, []);

  /** Derive the array of media ID strings to send to Convex mutations */
  const mediaIds = useMemo(
    () => attachedMedia.map((m) => m.mediaId as string),
    [attachedMedia],
  );

  const alreadyAttachedIds = useMemo(
    () => new Set(attachedMedia.map((m) => m.mediaId as string)),
    [attachedMedia],
  );

  // ─── Submit handlers ─────────────────────────────────────────────────────────

  async function handleSaveDraft() {
    if (isSubmitting || !content.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await createPost({
        content: content.trim(),
        platforms: selectedPlatforms,
        mediaIds,
        hashtags,
        timezone,
        status: "draft",
      });

      setFeedback({ type: "success", text: "Draft saved successfully." });
      toast.success("Draft saved successfully.");

      // Short delay before navigating so the user sees the feedback
      setTimeout(() => router.push("/dashboard/posts"), 800);
    } catch (error) {
      console.error("Failed to save draft:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save draft.";
      setFeedback({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSchedule() {
    if (isSubmitting || !content.trim() || selectedPlatforms.length === 0) return;
    if (!scheduledDate || !scheduledTime) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const localDate = new Date(`${scheduledDate}T${scheduledTime}`);
      const scheduledAt = localToUtcTimestamp(localDate, timezone);

      await schedulePost({
        content: content.trim(),
        platforms: selectedPlatforms,
        mediaIds,
        hashtags,
        scheduledAt,
        timezone,
      });

      setFeedback({ type: "success", text: "Post scheduled successfully." });
      toast.success("Post scheduled successfully.");
      setTimeout(() => router.push("/dashboard/posts"), 800);
    } catch (error) {
      console.error("Failed to schedule post:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to schedule post.";
      setFeedback({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublishNow() {
    if (isSubmitting || !content.trim() || selectedPlatforms.length === 0) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await publishNow({
        content: content.trim(),
        platforms: selectedPlatforms,
        mediaIds,
        hashtags,
        timezone,
      });

      if (result.success) {
        setFeedback({ type: "success", text: "Post published successfully!" });
        toast.success("Post published successfully!");
      } else {
        const failMessage = "Publishing failed. Check your connected accounts and try again.";
        setFeedback({ type: "error", text: failMessage });
        toast.error(failMessage);
      }

      setTimeout(() => router.push("/dashboard/posts"), 1200);
    } catch (error) {
      console.error("Failed to publish post:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to publish post.";
      setFeedback({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitForApproval() {
    if (isSubmitting || !content.trim() || selectedPlatforms.length === 0) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      // First, create the post as a draft
      let scheduledAt: number | undefined;
      if (scheduleMode === "scheduled" && scheduledDate && scheduledTime) {
        const localDate = new Date(`${scheduledDate}T${scheduledTime}`);
        scheduledAt = localToUtcTimestamp(localDate, timezone);
      }

      const postId = await createPost({
        content: content.trim(),
        platforms: selectedPlatforms,
        mediaIds,
        hashtags,
        scheduledAt,
        timezone,
        status: "draft",
      });

      // Then submit for approval
      await submitForApprovalMutation({
        postId,
        note: scheduleMode === "scheduled"
          ? `Scheduled for ${scheduledDate} at ${scheduledTime} (${timezone})`
          : undefined,
      });

      setFeedback({ type: "success", text: "Post submitted for approval." });
      toast.success("Post submitted for approval.");
      setTimeout(() => router.push("/dashboard/posts"), 800);
    } catch (error) {
      console.error("Failed to submit for approval:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit for approval.";
      setFeedback({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePrimaryAction() {
    if (requiresApproval) {
      handleSubmitForApproval();
    } else if (scheduleMode === "scheduled") {
      handleSchedule();
    } else {
      handlePublishNow();
    }
  }

  // ─── Validation ───────────────────────────────────────────────────────────────

  const hasContent = content.trim().length > 0;
  const hasPlatforms = selectedPlatforms.length > 0;
  const isScheduleValid =
    scheduleMode === "now" ||
    (scheduleMode === "scheduled" && scheduledDate && scheduledTime);
  const canSubmit = hasContent && hasPlatforms && isScheduleValid && !isSubmitting;

  // Check if content exceeds any selected platform's limit
  const hasExceededLimit = selectedPlatforms.some((p) => {
    const remaining = remainingChars(content, p);
    return remaining !== null && remaining < 0;
  });

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* ── Left column: Composer form ──────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-6">
        {/* Feedback banner */}
        {feedback && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium",
              feedback.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200",
            )}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {feedback.text}
          </div>
        )}

        {/* Content textarea */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <label
            htmlFor="post-content"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Post Content
          </label>
          <textarea
            ref={textareaRef}
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What would you like to share?"
            className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows={6}
          />

          {/* Toolbar: AI Assist + Rewrite buttons + Character counts */}
          <div className="mt-3 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAiPanelOpen(true)}
                className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 sm:min-h-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Assist
              </button>
              {hasContent && (
                <button
                  type="button"
                  onClick={() => setShowRewritePanel((prev) => !prev)}
                  className={cn(
                    "flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:min-h-0",
                    showRewritePanel
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  )}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Rewrite
                </button>
              )}
            </div>

            {/* Character counts per selected platform */}
            {selectedPlatforms.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {selectedPlatforms.map((platformId) => {
                  const remaining = remainingChars(content, platformId);
                  const limit = PLATFORM_CHAR_LIMITS[platformId] ?? 0;
                  const platformDef = PLATFORMS.find((p) => p.id === platformId);
                  if (!platformDef) return null;
                  const Icon = platformDef.icon;
                  return (
                    <div
                      key={platformId}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <Icon className={cn("h-3.5 w-3.5", platformDef.color)} />
                      <span className={charCountColor(remaining, limit)}>
                        {remaining !== null ? remaining.toLocaleString() : "--"}
                      </span>
                      <span className="text-gray-400">remaining</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* AI Rewrite Panel (shown below content when toggled) */}
        {showRewritePanel && (
          <AiRewritePanel
            content={content}
            onUseRewrite={handleUseRewrite}
          />
        )}

        {/* Platform toggles */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Platforms
          </label>
          {availablePlatforms.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center">
              <p className="text-sm text-gray-500">
                No social accounts connected.
              </p>
              <a
                href="/dashboard/accounts"
                className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Connect an account to start posting
              </a>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {availablePlatforms.map((platform) => {
                  const selected = selectedPlatforms.includes(platform.id);
                  const Icon = platform.icon;
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all",
                        selected
                          ? cn(platform.bgActive, platform.borderActive, platform.color)
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {platform.label}
                    </button>
                  );
                })}
              </div>
              {!hasPlatforms && (
                <p className="mt-2 text-xs text-amber-600">
                  Select at least one platform to publish to.
                </p>
              )}
            </>
          )}
        </div>

        {/* Hashtags */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <HashtagInput hashtags={hashtags} onChange={setHashtags} />
          <div className="border-t border-gray-100 pt-4">
            <HashtagSuggestions
              content={content}
              currentHashtags={hashtags}
              onAddHashtag={handleAddHashtag}
            />
          </div>
        </div>

        {/* Media attachments */}
        <MediaAttachments
          attachedMedia={attachedMedia}
          onAttach={handleMediaAttach}
          onRemove={handleMediaRemove}
          onOpenLibrary={() => setIsMediaLibraryOpen(true)}
        />

        {/* Schedule picker */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Scheduling
          </label>

          {/* Toggle buttons */}
          <div className="flex flex-col gap-2 mb-4 sm:flex-row">
            <button
              type="button"
              onClick={() => setScheduleMode("now")}
              className={cn(
                "flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:min-h-0",
                scheduleMode === "now"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              <Send className="h-4 w-4" />
              Post Now
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode("scheduled")}
              className={cn(
                "flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:min-h-0",
                scheduleMode === "scheduled"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              <Clock className="h-4 w-4" />
              Schedule for Later
            </button>
          </div>

          {/* Date/time/timezone inputs (shown only in schedule mode) */}
          {scheduleMode === "scheduled" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="schedule-date"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Date
                </label>
                <input
                  id="schedule-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="schedule-time"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Time
                </label>
                <input
                  id="schedule-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="schedule-timezone"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Timezone
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    id="schedule-timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Approval notice */}
        {requiresApproval && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Approval required
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Your role requires posts to be reviewed before publishing. This
                post will be sent to an admin or editor for approval.
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={!hasContent || isSubmitting}
            onClick={handleSaveDraft}
            className={cn(
              "flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors",
              hasContent && !isSubmitting
                ? "hover:bg-gray-50"
                : "cursor-not-allowed opacity-50",
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save as Draft
          </button>
          <button
            type="button"
            disabled={!canSubmit || hasExceededLimit}
            onClick={handlePrimaryAction}
            className={cn(
              "flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors",
              requiresApproval
                ? cn(
                    "bg-amber-600",
                    canSubmit && !hasExceededLimit
                      ? "hover:bg-amber-700"
                      : "cursor-not-allowed opacity-50",
                  )
                : cn(
                    "bg-indigo-600",
                    canSubmit && !hasExceededLimit
                      ? "hover:bg-indigo-700"
                      : "cursor-not-allowed opacity-50",
                  ),
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : requiresApproval ? (
              <>
                <CheckSquare className="h-4 w-4" />
                Submit for Approval
              </>
            ) : scheduleMode === "scheduled" ? (
              <>
                <Clock className="h-4 w-4" />
                Schedule Post
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Post Now
              </>
            )}
          </button>

          {hasExceededLimit && (
            <p className="text-xs text-red-600 font-medium">
              Content exceeds character limit for one or more platforms.
            </p>
          )}
        </div>
      </div>

      {/* ── Right column: Platform previews ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Platform Preview
          </h3>

          {selectedPlatforms.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              Select a platform to see a preview.
            </p>
          ) : (
            <>
              {/* Preview tab bar */}
              <div className="flex gap-1 border-b border-gray-200 mb-4">
                {selectedPlatforms.map((platformId) => {
                  const platformDef = PLATFORMS.find(
                    (p) => p.id === platformId,
                  );
                  if (!platformDef) return null;
                  const Icon = platformDef.icon;
                  const isActive = activePreviewTab === platformId;
                  return (
                    <button
                      key={platformId}
                      type="button"
                      onClick={() => setActivePreviewTab(platformId)}
                      className={cn(
                        "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
                        isActive
                          ? "border-indigo-600 text-indigo-600"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {platformDef.label}
                    </button>
                  );
                })}
              </div>

              {/* Active preview */}
              {activePreviewTab && (() => {
                const acct = getAccountForPlatform(activePreviewTab);
                return (
                  <PlatformPreview
                    platform={activePreviewTab}
                    content={content}
                    hashtags={hashtags}
                    accountName={acct?.accountName}
                    accountImageUrl={acct?.profileImageUrl}
                  />
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* ── AI Caption Panel (slide-in overlay from right) ──────────────────── */}
      {isAiPanelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsAiPanelOpen(false)}
          />
          <AiCaptionPanel
            isOpen={isAiPanelOpen}
            onClose={() => setIsAiPanelOpen(false)}
            onUseCaption={handleUseCaption}
            selectedPlatforms={selectedPlatforms}
          />
        </>
      )}

      {/* ── Media Library Picker ──────────────────────────────────────────── */}
      <MediaLibraryPicker
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelect={handleLibrarySelect}
        alreadyAttachedIds={alreadyAttachedIds}
        maxSelectable={10 - attachedMedia.length}
      />
    </div>
  );
}
