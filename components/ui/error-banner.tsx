"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({ message, onRetry, className }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className={cn(
        "relative flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-sm",
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-red-800">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
          >
            Try Again
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-lg p-1 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
        aria-label="Dismiss error"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
