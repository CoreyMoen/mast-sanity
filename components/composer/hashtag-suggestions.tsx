"use client";

/**
 * hashtag-suggestions.tsx — AI-powered hashtag suggestions.
 *
 * Analyzes the current post content and suggests relevant hashtags grouped
 * by category (trending, niche, brand). Clicking a hashtag pill adds it
 * to the post's hashtag list.
 */

import { useState, useCallback } from "react";
import { Hash, Loader2, Sparkles, TrendingUp, Target, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface HashtagSuggestionsProps {
  /** Current post content to analyze */
  content: string;
  /** Current hashtags already applied */
  currentHashtags: string[];
  /** Add a hashtag to the post */
  onAddHashtag: (hashtag: string) => void;
}

interface HashtagGroup {
  category: "trending" | "niche" | "brand";
  label: string;
  icon: React.ElementType;
  tags: string[];
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  trending: {
    label: "Trending",
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  niche: {
    label: "Niche",
    icon: Target,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  brand: {
    label: "Brand / Long-tail",
    icon: Tag,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
};

/**
 * Categorize hashtags into trending / niche / brand groups.
 * Since the LLM returns a flat list, we use a simple heuristic:
 * shorter tags tend to be higher-volume (trending), medium ones
 * are niche, and longer compound tags are brand/long-tail.
 */
function categorizeHashtags(tags: string[]): HashtagGroup[] {
  const trending: string[] = [];
  const niche: string[] = [];
  const brand: string[] = [];

  for (const tag of tags) {
    const len = tag.length;
    if (len <= 8) {
      trending.push(tag);
    } else if (len <= 15) {
      niche.push(tag);
    } else {
      brand.push(tag);
    }
  }

  const groups: HashtagGroup[] = [];
  if (trending.length > 0) {
    groups.push({
      category: "trending",
      label: "Trending",
      icon: TrendingUp,
      tags: trending,
    });
  }
  if (niche.length > 0) {
    groups.push({
      category: "niche",
      label: "Niche",
      icon: Target,
      tags: niche,
    });
  }
  if (brand.length > 0) {
    groups.push({
      category: "brand",
      label: "Brand / Long-tail",
      icon: Tag,
      tags: brand,
    });
  }

  return groups;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HashtagSuggestions({
  content,
  currentHashtags,
  onAddHashtag,
}: HashtagSuggestionsProps) {
  const suggestHashtags = useAction(api.ai.suggestHashtags);

  const [groups, setGroups] = useState<HashtagGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSuggested, setHasSuggested] = useState(false);

  const hasContent = content.trim().length > 0;

  const handleSuggest = useCallback(async () => {
    if (!hasContent) return;

    setIsLoading(true);
    setError(null);
    setGroups([]);

    try {
      const result = await suggestHashtags({
        content: content.trim(),
        platform: "instagram",
      });

      const tags: string[] = Array.isArray(result.hashtags) ? result.hashtags : [];

      const categorized = categorizeHashtags(tags);
      setGroups(categorized);
      setHasSuggested(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [content, hasContent, suggestHashtags]);

  const isAlreadyAdded = (tag: string) =>
    currentHashtags.includes(tag.toLowerCase());

  return (
    <div>
      {/* Suggest button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span className="text-xs font-medium text-gray-500">
            AI Hashtag Suggestions
          </span>
        </div>
        <button
          type="button"
          onClick={handleSuggest}
          disabled={!hasContent || isLoading}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            hasContent && !isLoading
              ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              : "cursor-not-allowed bg-gray-50 text-gray-400",
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Hash className="h-3 w-3" />
              {hasSuggested ? "Re-suggest" : "Suggest Hashtags"}
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="animate-pulse flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-7 rounded-full bg-gray-200"
              style={{ width: `${60 + Math.random() * 60}px` }}
            />
          ))}
        </div>
      )}

      {/* No content hint */}
      {!hasContent && !hasSuggested && (
        <p className="text-xs text-gray-400 italic">
          Write your post content first, then click &quot;Suggest Hashtags&quot; for AI-powered recommendations.
        </p>
      )}

      {/* Grouped hashtag suggestions */}
      {!isLoading && groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((group) => {
            const config = CATEGORY_CONFIG[group.category];
            const Icon = config.icon;

            return (
              <div key={group.category}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className={cn("h-3 w-3", config.color)} />
                  <span className={cn("text-xs font-medium", config.color)}>
                    {config.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.tags.map((tag) => {
                    const added = isAlreadyAdded(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!added) onAddHashtag(tag);
                        }}
                        disabled={added}
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                          added
                            ? "cursor-default border border-green-200 bg-green-50 text-green-600"
                            : cn(
                                "border cursor-pointer hover:shadow-sm",
                                config.bgColor,
                                `border-transparent`,
                                config.color,
                                "hover:border-current",
                              ),
                        )}
                        title={added ? "Already added" : `Add #${tag}`}
                      >
                        #{tag}
                        {added && (
                          <span className="ml-1 text-green-500">
                            &#10003;
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
