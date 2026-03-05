"use client";

import { useState } from "react";
import {
  CheckSquare,
  Check,
  X,
  MessageSquare,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApprovalDialog } from "@/components/approvals/approval-dialog";
import { ApprovalTimeline } from "@/components/approvals/approval-timeline";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { UpgradeGate } from "@/components/ui/upgrade-gate";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/ui/toast";
import type { SubscriptionTier } from "@/lib/utils/validation";

// ─── Types ──────────────────────────────────────────────────────────────────────

type TabValue = "pending_approval" | "approved" | "rejected" | "all";
type ApprovalAction = "approve" | "reject" | "request_changes";

// ─── Platform icon map ──────────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, { icon: typeof Instagram; color: string }> = {
  instagram: { icon: Instagram, color: "text-pink-600" },
  facebook: { icon: Facebook, color: "text-blue-600" },
  twitter: { icon: Twitter, color: "text-sky-500" },
  linkedin: { icon: Linkedin, color: "text-blue-700" },
};

// ─── Tab config ─────────────────────────────────────────────────────────────────

const TABS: { value: TabValue; label: string }[] = [
  { value: "pending_approval", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function truncateContent(content: string, maxLength = 140): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trimEnd() + "...";
}

function formatRelativeTime(ts: number): string {
  const now = Date.now();
  const diffMs = now - ts;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatScheduledDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Approval history sub-component ─────────────────────────────────────────────

function ApprovalHistorySection({ postId }: { postId: Id<"posts"> }) {
  const events = useQuery(api.approvals.getApprovalHistory, { postId });

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
        Approval History
      </h4>
      {events === undefined || events === null ? (
        <p className="text-xs text-gray-400">Loading history...</p>
      ) : (
        <ApprovalTimeline events={events} />
      )}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("pending_approval");
  const [dialogState, setDialogState] = useState<{
    action: ApprovalAction;
    postId: string;
  } | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const toast = useToast();

  // Convex queries
  const postLimit = useQuery(api.featureGates.checkPostLimit);
  const tier: SubscriptionTier = (postLimit?.tier as SubscriptionTier) ?? "free";
  const rawPosts = useQuery(api.approvals.listPendingApprovals, {
    statusFilter: activeTab,
  });
  const pendingCountResult = useQuery(api.approvals.countPending, {});

  const posts = rawPosts ?? [];
  const pendingCount = pendingCountResult ?? 0;
  const isLoading = rawPosts === undefined || rawPosts === null;

  function handleDialogComplete() {
    const action = dialogState?.action;
    setDialogState(null);
    if (action === "approve") {
      toast.success("Post approved successfully.");
    } else if (action === "reject") {
      toast.success("Post rejected.");
    } else if (action === "request_changes") {
      toast.success("Changes requested. The author has been notified.");
    }
  }

  function toggleTimeline(postId: string) {
    setExpandedPost(expandedPost === postId ? null : postId);
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <CheckSquare className="h-7 w-7 text-indigo-600" />
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Approvals
          </h1>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-0.5 text-sm font-medium text-amber-700">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Review and approve posts submitted by your team members.
        </p>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-4 overflow-x-auto sm:gap-6" aria-label="Approval status tabs">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "min-h-[44px] shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors sm:min-h-0",
                activeTab === tab.value
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              )}
            >
              {tab.label}
              {tab.value === "pending_approval" && pendingCount > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Post list ─────────────────────────────────────────────────────── */}
      <UpgradeGate feature="approvalWorkflows" tier={tier}>
      <div className="mt-6 space-y-4 pb-20">
        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : posts.length === 0 ? (
          /* Empty state */
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <CheckSquare className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-4 text-sm font-semibold text-gray-900">
              {activeTab === "pending_approval"
                ? "No posts pending approval"
                : activeTab === "approved"
                  ? "No approved posts"
                  : activeTab === "rejected"
                    ? "No rejected posts"
                    : "No approval activity yet"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === "pending_approval"
                ? "When team members submit posts for review, they will appear here."
                : "Posts with this status will appear here."}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post._id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Post card */}
              <div className="p-5">
                {/* Top row: author + status + timestamp */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Author avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                      {post.authorName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {post.authorName}
                      </span>
                      <p className="text-xs text-gray-400">
                        Submitted {formatRelativeTime(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={post.status} />
                </div>

                {/* Content preview */}
                <div className="mt-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {truncateContent(post.content)}
                  </p>
                </div>

                {/* Platform pills + scheduled info */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {/* Platforms */}
                  <div className="flex items-center gap-1.5">
                    {post.platforms.map((platform: string) => {
                      const platformConfig = PLATFORM_ICONS[platform];
                      if (!platformConfig) return null;
                      const PlatformIcon = platformConfig.icon;
                      return (
                        <div
                          key={platform}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100"
                          title={platform}
                        >
                          <PlatformIcon
                            className={cn("h-3.5 w-3.5", platformConfig.color)}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Scheduled time */}
                  {post.scheduledAt && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        Scheduled for {formatScheduledDate(post.scheduledAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Approval note (for rejected/changes_requested) */}
                {post.approvalNote &&
                  (post.status === "rejected" ||
                    post.status === "changes_requested" ||
                    post.status === "approved") && (
                    <div
                      className={cn(
                        "mt-3 rounded-lg border px-3 py-2",
                        post.status === "rejected" &&
                          "border-red-100 bg-red-50",
                        post.status === "changes_requested" &&
                          "border-orange-100 bg-orange-50",
                        post.status === "approved" &&
                          "border-green-100 bg-green-50",
                      )}
                    >
                      <p
                        className={cn(
                          "text-xs font-medium mb-0.5",
                          post.status === "rejected" && "text-red-700",
                          post.status === "changes_requested" &&
                            "text-orange-700",
                          post.status === "approved" && "text-green-700",
                        )}
                      >
                        {post.status === "rejected"
                          ? "Rejection reason:"
                          : post.status === "changes_requested"
                            ? "Requested changes:"
                            : "Approval note:"}
                      </p>
                      <p
                        className={cn(
                          "text-sm",
                          post.status === "rejected" && "text-red-600",
                          post.status === "changes_requested" &&
                            "text-orange-600",
                          post.status === "approved" && "text-green-600",
                        )}
                      >
                        {post.approvalNote}
                      </p>
                    </div>
                  )}

                {/* Action buttons */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {post.status === "pending_approval" && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setDialogState({
                            action: "approve",
                            postId: post._id,
                          })
                        }
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 sm:min-h-0"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDialogState({
                            action: "request_changes",
                            postId: post._id,
                          })
                        }
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-orange-300 bg-white px-3.5 py-2 text-sm font-medium text-orange-700 shadow-sm transition-colors hover:bg-orange-50 sm:min-h-0"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Request Changes
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDialogState({
                            action: "reject",
                            postId: post._id,
                          })
                        }
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3.5 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 sm:min-h-0"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}

                  {/* Timeline toggle */}
                  <button
                    type="button"
                    onClick={() => toggleTimeline(post._id)}
                    className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 sm:min-h-0"
                  >
                    History
                    {expandedPost === post._id ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded timeline section */}
              {expandedPost === post._id && (
                <ApprovalHistorySection postId={post._id as Id<"posts">} />
              )}
            </div>
          ))
        )}
      </div>

      </UpgradeGate>

      {/* ── Approval dialog ───────────────────────────────────────────────── */}
      {dialogState && (
        <ApprovalDialog
          action={dialogState.action}
          postId={dialogState.postId}
          onComplete={handleDialogComplete}
          onCancel={() => setDialogState(null)}
        />
      )}
    </div>
  );
}
