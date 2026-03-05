"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight, Loader2, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDay, type CalendarPost } from "./calendar-day";
import { WeekView } from "./week-view";

// ---------------------------------------------------------------------------
// Day-of-week headers
// ---------------------------------------------------------------------------
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---------------------------------------------------------------------------
// Status legend items
// ---------------------------------------------------------------------------
const STATUS_LEGEND: { label: string; color: string }[] = [
  { label: "Draft", color: "bg-gray-400" },
  { label: "Scheduled", color: "bg-indigo-500" },
  { label: "Published", color: "bg-green-500" },
  { label: "Failed", color: "bg-red-500" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type ViewMode = "month" | "week";

export function CalendarView() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Drag-and-drop rescheduling
  const reschedulePost = useMutation(api.scheduling.reschedulePost);
  const toast = useToast();
  const [activePost, setActivePost] = useState<CalendarPost | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Compute date range for the visible grid (includes leading/trailing days)
  const gridStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });

  // Fetch posts from Convex for the visible date range
  const rawPosts = useQuery(api.posts.listScheduled, {
    startDate: gridStart.getTime(),
    endDate: gridEnd.getTime(),
  });

  // Map Convex post records to CalendarPost shape
  const posts: CalendarPost[] = useMemo(() => {
    if (!rawPosts) return [];
    return rawPosts.map((post) => ({
      id: post._id,
      content: post.content,
      status: (post.status === "publishing" ? "scheduled" : post.status) as CalendarPost["status"],
      scheduledAt: new Date(post.scheduledAt ?? post.createdAt),
      platforms: post.platforms,
    }));
  }, [rawPosts]);

  function handleDragStart(event: DragStartEvent) {
    const post = posts.find((p) => p.id === event.active.id);
    if (post) setActivePost(post);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActivePost(null);
    const { active, over } = event;
    if (!over) return;

    const postId = active.id as string;
    const post = posts.find((p) => p.id === postId);
    if (!post || post.status !== "scheduled") return;

    // over.id is the date ISO string (for month view) or dateISO_hour (for week view)
    const overId = over.id as string;
    let newDate: Date;

    if (overId.includes("_")) {
      // Week view: "2024-01-15T00:00:00.000Z_14" format
      const [dateStr, hourStr] = overId.split("_");
      newDate = new Date(dateStr);
      newDate.setHours(parseInt(hourStr, 10), 0, 0, 0);
    } else {
      // Month view: just the date ISO, keep the original time
      newDate = new Date(overId);
      newDate.setHours(
        post.scheduledAt.getHours(),
        post.scheduledAt.getMinutes(),
        0,
        0
      );
    }

    try {
      await reschedulePost({
        postId: postId as Id<"posts">,
        scheduledAt: newDate.getTime(),
      });
      toast.success("Post rescheduled.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reschedule."
      );
    }
  }

  // Calendar grid days (including leading/trailing days from adjacent months)
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [gridStart, gridEnd]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, CalendarPost[]>();
    for (const post of posts) {
      if (!post.scheduledAt) continue;
      const key = format(post.scheduledAt, "yyyy-MM-dd");
      const existing = map.get(key) || [];
      existing.push(post);
      map.set(key, existing);
    }
    return map;
  }, [posts]);

  function postsForDay(day: Date): CalendarPost[] {
    return postsByDay.get(format(day, "yyyy-MM-dd")) ?? [];
  }

  function handlePrev() {
    setCurrentDate((d) => subMonths(d, 1));
  }

  function handleNext() {
    setCurrentDate((d) => addMonths(d, 1));
  }

  function handleDayClick(day: Date) {
    setSelectedDate(day);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar -------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-700 sm:h-9 sm:w-9"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="min-w-[140px] text-center text-base font-semibold text-gray-900 sm:min-w-[170px] sm:text-lg">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-700 sm:h-9 sm:w-9"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Today button */}
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="ml-2 min-h-[44px] rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 sm:min-h-0"
          >
            Today
          </button>
        </div>

        {/* View toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={cn(
              "min-h-[44px] rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:min-h-0",
              viewMode === "month"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={cn(
              "min-h-[44px] rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:min-h-0",
              viewMode === "week"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Status legend -------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-4">
        {STATUS_LEGEND.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", s.color)} />
            <span className="text-xs font-medium text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar body -------------------------------------------------------- */}
      {(rawPosts === undefined || rawPosts === null) && (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-20">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          <span className="ml-2 text-sm text-gray-500">Loading posts...</span>
        </div>
      )}
      {rawPosts !== undefined && rawPosts !== null && rawPosts.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No posts this month"
          description="You have no scheduled, draft, or published posts for this period. Create a post to see it on the calendar."
          actionLabel="Create Post"
          actionHref="/dashboard/posts/new"
        />
      )}
      {rawPosts !== undefined && rawPosts !== null && rawPosts.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {viewMode === "month" ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {/* Day-of-week header row */}
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {DAY_HEADERS.map((label) => (
                  <div
                    key={label}
                    className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {calendarDays.map((day) => (
                  <CalendarDay
                    key={day.toISOString()}
                    date={day}
                    posts={postsForDay(day)}
                    isCurrentMonth={isSameMonth(day, currentDate)}
                    isToday={isSameDay(day, today)}
                    isSelected={
                      selectedDate !== null && isSameDay(day, selectedDate)
                    }
                    onClick={() => handleDayClick(day)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <WeekView
              currentDate={selectedDate ?? currentDate}
              posts={posts}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
            />
          )}

          <DragOverlay>
            {activePost ? (
              <div className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 shadow-lg">
                <p className="text-sm font-medium text-indigo-700">
                  {activePost.content.slice(0, 40)}
                  {activePost.content.length > 40 ? "..." : ""}
                </p>
                <p className="text-xs text-indigo-500">
                  {activePost.platforms.join(", ")}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Selected day info ---------------------------------------------------- */}
      {selectedDate && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h3>
          {postsForDay(selectedDate).length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              No posts scheduled for this day.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {postsForDay(selectedDate).map((post) => (
                <li
                  key={post.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      STATUS_LEGEND.find(
                        (s) => s.label.toLowerCase() === post.status
                      )?.color ?? "bg-gray-400"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">{post.content}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {format(post.scheduledAt, "h:mm a")} &middot;{" "}
                      {post.platforms.join(", ")} &middot;{" "}
                      <span className="capitalize">{post.status}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
