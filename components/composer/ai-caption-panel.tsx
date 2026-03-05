"use client";

/**
 * ai-caption-panel.tsx — AI-powered caption generation side panel.
 *
 * Provides a prompt-based caption generator with tone, platform, and language
 * selection. Shows 3 caption suggestions with "Use This" and "Regenerate"
 * actions. Integrates with the Convex `generateCaption` action.
 */

import { useState, useCallback } from "react";
import { Sparkles, RefreshCw, Check, X, ChevronDown, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const TONES = [
  { value: "casual", label: "Casual" },
  { value: "professional", label: "Professional" },
  { value: "humorous", label: "Humorous" },
  { value: "inspirational", label: "Inspirational" },
  { value: "promotional", label: "Promotional" },
] as const;

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "X / Twitter" },
  { value: "linkedin", label: "LinkedIn" },
] as const;

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface AiCaptionPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Close the panel */
  onClose: () => void;
  /** Insert the chosen caption into the composer */
  onUseCaption: (caption: string) => void;
  /** Pre-selected platforms from the composer */
  selectedPlatforms?: string[];
}

interface CaptionSuggestion {
  id: string;
  text: string;
  isRegenerating: boolean;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SuggestionSkeleton() {
  return (
    <div className="animate-pulse space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="h-3 w-full rounded bg-gray-200" />
      <div className="h-3 w-5/6 rounded bg-gray-200" />
      <div className="h-3 w-4/6 rounded bg-gray-200" />
      <div className="mt-3 flex gap-2">
        <div className="h-8 w-20 rounded bg-gray-200" />
        <div className="h-8 w-24 rounded bg-gray-200" />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/** Extract a human-readable message from Convex errors. */
function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "data" in err) {
    const data = (err as any).data;
    if (typeof data === "string") return data;
    if (data && typeof data.message === "string") return data.message;
  }
  if (err instanceof Error) return err.message;
  return "Failed to generate captions. Please try again.";
}

export function AiCaptionPanel({
  isOpen,
  onClose,
  onUseCaption,
  selectedPlatforms: externalPlatforms = [],
}: AiCaptionPanelProps) {
  const generateCaption = useAction(api.ai.generateCaption);
  const usageStats = useQuery(api.ai.getUsageStats);
  const connectedAccounts = useQuery(api.socialAccounts.list);

  // Filter platform list to only show connected accounts
  const availablePlatforms = connectedAccounts
    ? PLATFORMS.filter((p) =>
        connectedAccounts.some((a: any) => a.platform === p.value && a.isActive),
      )
    : PLATFORMS;

  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<string>("casual");
  const [platforms, setPlatforms] = useState<string[]>(externalPlatforms);
  const [language, setLanguage] = useState("en");
  const [suggestions, setSuggestions] = useState<CaptionSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync platforms from parent if they change
  // (only set initially, user can override)

  const togglePlatform = useCallback((platformValue: string) => {
    setPlatforms((prev) =>
      prev.includes(platformValue)
        ? prev.filter((p) => p !== platformValue)
        : [...prev, platformValue],
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setSuggestions([]);

    try {
      const result = await generateCaption({
        prompt: prompt.trim(),
        platform: platforms[0] ?? "instagram",
        tone,
      });

      const captions: string[] = Array.isArray(result.suggestions)
        ? result.suggestions
        : [result.suggestions ?? "No suggestion generated."];
      const newSuggestions: CaptionSuggestion[] = captions.map((text: string, i: number) => ({
        id: `suggestion-${Date.now()}-${i}`,
        text,
        isRegenerating: false,
      }));

      setSuggestions(newSuggestions);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, tone, platforms, generateCaption]);

  const handleRegenerate = useCallback(
    async (suggestionId: string) => {
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestionId ? { ...s, isRegenerating: true } : s,
        ),
      );

      try {
        const result = await generateCaption({
          prompt: prompt.trim(),
          platform: platforms[0] ?? "instagram",
          tone,
        });
        const newText = Array.isArray(result.suggestions) ? result.suggestions[0] : result.suggestions ?? "No suggestion generated.";

        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === suggestionId
              ? { ...s, text: newText, isRegenerating: false }
              : s,
          ),
        );
      } catch {
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === suggestionId ? { ...s, isRegenerating: false } : s,
          ),
        );
        setError("Failed to regenerate caption. Please try again.");
      }
    },
    [prompt, tone, generateCaption],
  );

  const creditsRemaining =
    usageStats
      ? usageStats.creditsLimit === -1
        ? Infinity
        : usageStats.creditsLimit - usageStats.creditsUsed
      : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white lg:inset-y-0 lg:left-auto lg:right-0 lg:w-full lg:max-w-lg lg:border-l lg:border-gray-200 lg:shadow-xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-gray-900">
            AI Caption Generator
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {creditsRemaining !== null && (() => {
            const isUnlimited = usageStats!.creditsLimit === -1;
            const ratio = isUnlimited ? 0 : usageStats!.creditsUsed / usageStats!.creditsLimit;
            const atLimit = !isUnlimited && ratio >= 1;
            const warning = !isUnlimited && ratio > 0.8;
            return (
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1",
                  atLimit
                    ? "bg-red-50"
                    : warning
                      ? "bg-amber-50"
                      : "bg-indigo-50",
                )}
              >
                <Zap
                  className={cn(
                    "h-3.5 w-3.5",
                    atLimit
                      ? "text-red-600"
                      : warning
                        ? "text-amber-600"
                        : "text-indigo-600",
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    atLimit
                      ? "text-red-700"
                      : warning
                        ? "text-amber-700"
                        : "text-indigo-700",
                  )}
                >
                  {isUnlimited
                    ? `${usageStats!.creditsUsed} credits · Unlimited`
                    : `${usageStats!.creditsUsed}/${usageStats!.creditsLimit} credits`}
                </span>
                {atLimit && (
                  <Link
                    href="/dashboard/settings"
                    className="ml-1 text-xs font-medium text-red-600 underline hover:text-red-800"
                  >
                    Upgrade
                  </Link>
                )}
              </div>
            );
          })()}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close AI panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Body (scrollable) ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Prompt input */}
        <div>
          <label
            htmlFor="ai-prompt"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            What should the caption be about?
          </label>
          <textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Launching our new summer collection with 20% off..."
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Tone selector */}
        <div>
          <label
            htmlFor="ai-tone"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Tone
          </label>
          <div className="relative">
            <select
              id="ai-tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Platform optimization — only shows connected accounts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Optimize for platforms
          </label>
          {availablePlatforms.length === 0 ? (
            <p className="text-xs text-gray-400 italic">
              No connected accounts.{" "}
              <Link href="/dashboard/accounts" className="text-indigo-600 underline hover:text-indigo-800">
                Connect an account
              </Link>{" "}
              to optimize captions for a platform.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availablePlatforms.map((p) => {
                const isSelected = platforms.includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePlatform(p.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                      isSelected
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Language selector */}
        <div>
          <label
            htmlFor="ai-language"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Language
          </label>
          <div className="relative">
            <select
              id="ai-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold shadow-sm transition-all",
            prompt.trim() && !isGenerating
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "cursor-not-allowed bg-gray-100 text-gray-400",
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Captions
            </>
          )}
        </button>

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading skeletons */}
        {isGenerating && (
          <div className="space-y-3">
            <SuggestionSkeleton />
            <SuggestionSkeleton />
            <SuggestionSkeleton />
          </div>
        )}

        {/* Suggestions list */}
        {!isGenerating && suggestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              Suggestions
            </h3>
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200"
              >
                {suggestion.isRegenerating ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 w-full rounded bg-gray-200" />
                    <div className="h-3 w-4/5 rounded bg-gray-200" />
                    <div className="h-3 w-3/5 rounded bg-gray-200" />
                  </div>
                ) : (
                  <>
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-xs font-medium text-gray-400">
                        Option {index + 1}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                      {suggestion.text}
                    </p>
                  </>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUseCaption(suggestion.text)}
                    disabled={suggestion.isRegenerating}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      suggestion.isRegenerating
                        ? "cursor-not-allowed bg-gray-100 text-gray-400"
                        : "bg-indigo-600 text-white hover:bg-indigo-700",
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Use This
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegenerate(suggestion.id)}
                    disabled={suggestion.isRegenerating}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      suggestion.isRegenerating
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                        : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    <RefreshCw
                      className={cn(
                        "h-3.5 w-3.5",
                        suggestion.isRegenerating && "animate-spin",
                      )}
                    />
                    Regenerate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
