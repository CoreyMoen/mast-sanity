"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Check,
  CheckCheck,
  Send,
  AlertTriangle,
  ClipboardCheck,
  ThumbsUp,
  ThumbsDown,
  CreditCard,
  Zap,
  Unplug,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Icon map for notification types ────────────────────────────────────────

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  post_published: Send,
  post_failed: AlertTriangle,
  approval_requested: ClipboardCheck,
  post_approved: ThumbsUp,
  post_rejected: ThumbsDown,
  subscription_changed: CreditCard,
  credits_low: Zap,
  account_disconnected: Unplug,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  post_published: "text-green-600 bg-green-50",
  post_failed: "text-red-600 bg-red-50",
  approval_requested: "text-indigo-600 bg-indigo-50",
  post_approved: "text-green-600 bg-green-50",
  post_rejected: "text-red-600 bg-red-50",
  subscription_changed: "text-blue-600 bg-blue-50",
  credits_low: "text-amber-600 bg-amber-50",
  account_disconnected: "text-gray-600 bg-gray-100",
};

// ─── Component ──────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = useQuery(api.notifications.list);
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
    } catch (error) {
      console.warn("[notifications] Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = async (notificationId: Id<"notifications">, isRead: boolean) => {
    if (!isRead) {
      try {
        await markRead({ notificationId });
      } catch (error) {
        console.warn("[notifications] Failed to mark as read:", error);
      }
    }
  };

  const displayCount = unreadCount ?? 0;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label={`Notifications${displayCount > 0 ? ` (${displayCount} unread)` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />

        {/* Unread badge */}
        {displayCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {displayCount > 99 ? "99+" : displayCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-96 rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>
            {displayCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <Bell className="h-10 w-10 text-gray-200" />
                <p className="mt-3 text-sm font-medium text-gray-500">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  We&apos;ll notify you about important updates
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((notification) => {
                  const Icon =
                    NOTIFICATION_ICONS[notification.type] ?? Bell;
                  const colorClass =
                    NOTIFICATION_COLORS[notification.type] ??
                    "text-gray-600 bg-gray-100";

                  return (
                    <li key={notification._id}>
                      <button
                        type="button"
                        onClick={() =>
                          handleNotificationClick(
                            notification._id,
                            notification.isRead,
                          )
                        }
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
                          !notification.isRead && "bg-indigo-50/30",
                        )}
                      >
                        {/* Icon */}
                        <div
                          className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            colorClass,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm leading-snug",
                              notification.isRead
                                ? "text-gray-600"
                                : "text-gray-900 font-medium",
                            )}
                          >
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              { addSuffix: true },
                            )}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {!notification.isRead && (
                          <div className="mt-2 flex shrink-0 items-center">
                            <Check className="h-3.5 w-3.5 text-indigo-400" />
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 text-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
