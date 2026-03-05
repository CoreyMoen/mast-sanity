"use client";

import { useState } from "react";
import { Check, X, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// ─── Types ──────────────────────────────────────────────────────────────────────

type ApprovalAction = "approve" | "reject" | "request_changes";

interface ApprovalDialogProps {
  action: ApprovalAction;
  postId: string;
  onComplete: () => void;
  onCancel: () => void;
}

// ─── Action config ──────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  ApprovalAction,
  {
    title: string;
    description: string;
    confirmLabel: string;
    confirmColor: string;
    confirmHoverColor: string;
    icon: typeof Check;
    inputLabel: string;
    inputPlaceholder: string;
    inputRequired: boolean;
  }
> = {
  approve: {
    title: "Approve Post",
    description:
      "This post will be approved and moved to scheduled (if it has a scheduled time) or marked as approved.",
    confirmLabel: "Approve",
    confirmColor: "bg-green-600",
    confirmHoverColor: "hover:bg-green-700",
    icon: Check,
    inputLabel: "Note (optional)",
    inputPlaceholder: "Add an optional note about this approval...",
    inputRequired: false,
  },
  reject: {
    title: "Reject Post",
    description:
      "This post will be rejected and the author will be notified. A reason is required.",
    confirmLabel: "Reject",
    confirmColor: "bg-red-600",
    confirmHoverColor: "hover:bg-red-700",
    icon: X,
    inputLabel: "Reason (required)",
    inputPlaceholder: "Explain why this post is being rejected...",
    inputRequired: true,
  },
  request_changes: {
    title: "Request Changes",
    description:
      "The author will be asked to revise this post based on your feedback.",
    confirmLabel: "Request Changes",
    confirmColor: "bg-orange-600",
    confirmHoverColor: "hover:bg-orange-700",
    icon: MessageSquare,
    inputLabel: "Feedback (required)",
    inputPlaceholder: "Describe the changes needed...",
    inputRequired: true,
  },
};

const MAX_REASON_LENGTH = 1000;

// ─── Component ──────────────────────────────────────────────────────────────────

export function ApprovalDialog({
  action,
  postId,
  onComplete,
  onCancel,
}: ApprovalDialogProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveMutation = useMutation(api.approvals.approve);
  const rejectMutation = useMutation(api.approvals.reject);
  const requestChangesMutation = useMutation(api.approvals.requestChanges);

  const config = ACTION_CONFIG[action];
  const Icon = config.icon;

  const isValid = config.inputRequired ? note.trim().length > 0 : true;
  const charCount = note.length;

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;
    if (note.length > MAX_REASON_LENGTH) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (action === "approve") {
        await approveMutation({
          postId: postId as Id<"posts">,
          note: note.trim() || undefined,
        });
      } else if (action === "reject") {
        await rejectMutation({
          postId: postId as Id<"posts">,
          reason: note.trim(),
        });
      } else if (action === "request_changes") {
        await requestChangesMutation({
          postId: postId as Id<"posts">,
          feedback: note.trim(),
        });
      }

      onComplete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              action === "approve" && "bg-green-100",
              action === "reject" && "bg-red-100",
              action === "request_changes" && "bg-orange-100",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                action === "approve" && "text-green-600",
                action === "reject" && "text-red-600",
                action === "request_changes" && "text-orange-600",
              )}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {config.title}
            </h2>
            <p className="text-sm text-gray-500">{config.description}</p>
          </div>
        </div>

        {/* Text area */}
        <div className="mt-4">
          <label
            htmlFor="approval-note"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {config.inputLabel}
          </label>
          <textarea
            id="approval-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={config.inputPlaceholder}
            rows={4}
            maxLength={MAX_REASON_LENGTH}
            className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="mt-1 flex items-center justify-between">
            <div>
              {config.inputRequired && note.trim().length === 0 && (
                <p className="text-xs text-amber-600">
                  This field is required.
                </p>
              )}
            </div>
            <span
              className={cn(
                "text-xs",
                charCount > MAX_REASON_LENGTH * 0.9
                  ? "text-red-500"
                  : "text-gray-400",
              )}
            >
              {charCount}/{MAX_REASON_LENGTH}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting || charCount > MAX_REASON_LENGTH}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              config.confirmColor,
              config.confirmHoverColor,
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {isSubmitting ? "Submitting..." : config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
