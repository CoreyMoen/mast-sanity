"use client";

import {
  Send,
  Check,
  X,
  MessageSquare,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ApprovalEvent {
  _id: string;
  action: "submitted" | "approved" | "rejected" | "changes_requested";
  actorName: string;
  actorEmail: string;
  note?: string;
  createdAt: number;
}

interface ApprovalTimelineProps {
  events: ApprovalEvent[];
  className?: string;
}

// ─── Action visual config ───────────────────────────────────────────────────────

const EVENT_CONFIG: Record<
  ApprovalEvent["action"],
  {
    label: string;
    icon: typeof Check;
    iconColor: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  submitted: {
    label: "Submitted for approval",
    icon: Send,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-200",
  },
  approved: {
    label: "Approved",
    icon: Check,
    iconColor: "text-green-600",
    bgColor: "bg-green-100",
    borderColor: "border-green-200",
  },
  rejected: {
    label: "Rejected",
    icon: X,
    iconColor: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
  },
  changes_requested: {
    label: "Changes requested",
    icon: MessageSquare,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-200",
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function ApprovalTimeline({ events, className }: ApprovalTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8", className)}>
        <Clock className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No approval history yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Vertical connecting line */}
      <div className="absolute left-5 top-5 bottom-5 w-px bg-gray-200" />

      <ul className="space-y-6">
        {events.map((event, index) => {
          const config = EVENT_CONFIG[event.action];
          const Icon = config.icon;
          const isLast = index === events.length - 1;

          return (
            <li key={event._id} className="relative flex gap-4">
              {/* Icon circle */}
              <div
                className={cn(
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                  config.bgColor,
                  config.borderColor,
                )}
              >
                <Icon className={cn("h-4 w-4", config.iconColor)} />
              </div>

              {/* Content */}
              <div className={cn("flex-1 pt-1", !isLast && "pb-2")}>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">
                    {event.actorName}
                  </span>
                  <span className="text-sm text-gray-500">
                    {config.label.toLowerCase()}
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-gray-400">
                  {formatTimestamp(event.createdAt)}
                </p>

                {/* Note/reason */}
                {event.note && (
                  <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {event.note}
                    </p>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
