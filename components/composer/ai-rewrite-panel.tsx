"use client";

/**
 * ai-rewrite-panel.tsx — Inline AI rewrite capability.
 *
 * Takes the current post content, lets the user pick a tone, and
 * shows rewritten variations with "Use This" buttons. Uses the
 * Convex `rewriteContent` action under the hood.
 */

import { useState, useCallback } from "react";
import { RefreshCw, Check, ChevronDown, Loader2, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const TONES = [
  { value: "casual", label: "Casual", description: "Friendly and conversational" },
  { value: "professional", label: "Professional", description: "Polished and authoritative" },
  { value: "humorous", label: "Humorous", description: "Witty and playful" },
  { value: "inspirational", label: "Inspirational", description: "Uplifting and motivational" },
  { value: "promotional", label: "Promotional", description: "Persuasive and action-oriented" },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface AiRewritePanelProps {
  /** The current content to rewrite */
  content: string;
  /** Replace the composer content with the rewritten text */
  onUseRewrite: (rewrittenText: string) => void;
}

interface RewriteVariation {
  id: string;
  text: string;
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
  return "Something went wrong. Please try again.";
}

export function AiRewritePanel({ content, onUseRewrite }: AiRewritePanelProps) {
  const rewriteContent = useAction(api.ai.rewriteContent);
  const usageStats = useQuery(api.ai.getUsageStats);

  const [tone, setTone] = useState<string>("professional");
  const [variations, setVariations] = useState<RewriteVariation[]>([]);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasContent = content.trim().length > 0;

  const handleRewrite = useCallback(async () => {
    if (!hasContent) return;

    setIsRewriting(true);
    setError(null);
    setVariations([]);

    try {
      const result = await rewriteContent({
        content: content.trim(),
        style: tone,
      });

      const variations: string[] = Array.isArray(result.variations)
        ? result.variations
        : [result.variations ?? "No rewrite generated."];
      const newVariations: RewriteVariation[] = variations.map((text: string, i: number) => ({
        id: `rewrite-${Date.now()}-${i}`,
        text,
      }));

      setVariations(newVariations);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsRewriting(false);
    }
  }, [content, tone, hasContent, rewriteContent]);

  const creditsRemaining =
    usageStats
      ? usageStats.creditsLimit === -1
        ? Infinity
        : usageStats.creditsLimit - usageStats.creditsUsed
      : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            AI Rewrite
          </h3>
        </div>
        {creditsRemaining !== null && (() => {
          const isUnlimited = usageStats!.creditsLimit === -1;
          const ratio = isUnlimited ? 0 : usageStats!.creditsUsed / usageStats!.creditsLimit;
          const atLimit = !isUnlimited && ratio >= 1;
          const warning = !isUnlimited && ratio > 0.8;
          return (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
                atLimit
                  ? "bg-red-50"
                  : warning
                    ? "bg-amber-50"
                    : "bg-indigo-50",
              )}
            >
              <Zap
                className={cn(
                  "h-3 w-3",
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
                  ? `${usageStats!.creditsUsed} · Unlimited`
                  : `${usageStats!.creditsUsed}/${usageStats!.creditsLimit}`}
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
      </div>

      {!hasContent ? (
        <p className="text-sm text-gray-400 italic">
          Write some content first, then use AI to rewrite it in a different tone.
        </p>
      ) : (
        <>
          {/* Current content preview */}
          <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Current content
            </p>
            <p className="text-sm text-gray-700 line-clamp-3">
              {content}
            </p>
          </div>

          {/* Tone selector + Rewrite button */}
          <div className="flex items-end gap-3 mb-4">
            <div className="flex-1">
              <label
                htmlFor="rewrite-tone"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Rewrite as
              </label>
              <div className="relative">
                <select
                  id="rewrite-tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-9 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <button
              type="button"
              onClick={handleRewrite}
              disabled={isRewriting}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all",
                isRewriting
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : "bg-indigo-600 text-white hover:bg-indigo-700",
              )}
            >
              {isRewriting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Rewriting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Rewrite
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {isRewriting && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-gray-200" />
                    <div className="h-3 w-4/5 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rewrite variations */}
          {!isRewriting && variations.length > 0 && (
            <div className="space-y-3">
              {variations.map((variation, index) => (
                <div
                  key={variation.id}
                  className="group rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-indigo-200"
                >
                  <div className="mb-1">
                    <span className="text-xs font-medium text-gray-400">
                      Variation {index + 1}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 mb-3">
                    {variation.text}
                  </p>
                  <button
                    type="button"
                    onClick={() => onUseRewrite(variation.text)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Use This
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
