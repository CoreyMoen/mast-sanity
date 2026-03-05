"use client";

import { useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachHourOfInterval,
  format,
  isSameDay,
  set,
} from "date-fns";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { CalendarPost } from "./calendar-day";

interface WeekViewProps {
  currentDate: Date;
  posts: CalendarPost[];
  selectedDate: Date | null;
  onDayClick: (date: Date) => void;
}

const STATUS_COLORS: Record<CalendarPost["status"], string> = {
  draft: "border-gray-300 bg-gray-50 text-gray-700",
  scheduled: "border-indigo-300 bg-indigo-50 text-indigo-700",
  published: "border-green-300 bg-green-50 text-green-700",
  failed: "border-red-300 bg-red-50 text-red-700",
};

const STATUS_DOT_COLORS: Record<CalendarPost["status"], string> = {
  draft: "bg-gray-400",
  scheduled: "bg-indigo-500",
  published: "bg-green-500",
  failed: "bg-red-500",
};

const START_HOUR = 6;
const END_HOUR = 23;

// ---------------------------------------------------------------------------
// Droppable cell wrapper for each day/hour slot
// ---------------------------------------------------------------------------

function DroppableCell({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        isOver && "bg-indigo-50 ring-1 ring-inset ring-indigo-300"
      )}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable post card — only "scheduled" posts can be dragged
// ---------------------------------------------------------------------------

function DraggablePostCard({ post }: { post: CalendarPost }) {
  const isDraggable = post.status === "scheduled";
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: post.id,
      disabled: !isDraggable,
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggable ? { ...listeners, ...attributes } : {})}
      className={cn(
        "mb-0.5 rounded border px-1.5 py-1",
        STATUS_COLORS[post.status],
        isDraggable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-1">
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            STATUS_DOT_COLORS[post.status]
          )}
        />
        <span className="truncate text-[11px] font-medium leading-tight">
          {post.content.length > 20
            ? post.content.slice(0, 20) + "..."
            : post.content}
        </span>
      </div>
      {post.platforms.length > 0 && (
        <span className="mt-0.5 block text-[10px] opacity-70">
          {post.platforms.join(", ")}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Week view component
// ---------------------------------------------------------------------------

export function WeekView({
  currentDate,
  posts,
  // selectedDate is part of the component interface but not yet used in the week view rendering
  selectedDate: _selectedDate,
  onDayClick,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const dayStart = set(currentDate, {
    hours: START_HOUR,
    minutes: 0,
    seconds: 0,
  });
  const dayEnd = set(currentDate, {
    hours: END_HOUR,
    minutes: 0,
    seconds: 0,
  });
  const hours = eachHourOfInterval({ start: dayStart, end: dayEnd });

  const today = new Date();

  const postsByDayHour = useMemo(() => {
    const map = new Map<string, typeof posts>();
    for (const post of posts) {
      if (!post.scheduledAt) continue;
      const d = post.scheduledAt;
      const key = `${format(d, "yyyy-MM-dd")}_${d.getHours()}`;
      const existing = map.get(key) || [];
      existing.push(post);
      map.set(key, existing);
    }
    return map;
  }, [posts]);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      {/* Day headers */}
      <div className="grid min-w-[640px] grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200">
        <div className="border-r border-gray-200 bg-gray-50 p-2" />
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick(day)}
              className={cn(
                "border-r border-gray-200 px-2 py-3 text-center transition-colors last:border-r-0 hover:bg-gray-50",
                isToday && "bg-indigo-50"
              )}
            >
              <span className="text-xs font-medium text-gray-500">
                {format(day, "EEE")}
              </span>
              <span
                className={cn(
                  "mt-1 flex items-center justify-center text-sm font-semibold",
                  isToday && "text-indigo-600",
                  !isToday && "text-gray-900"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full",
                    isToday && "bg-indigo-600 text-white"
                  )}
                >
                  {format(day, "d")}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        <div className="grid min-w-[640px] grid-cols-[60px_repeat(7,1fr)]">
          {hours.map((hour) => (
            <div key={hour.toISOString()} className="contents">
              {/* Time label */}
              <div className="border-b border-r border-gray-100 bg-gray-50 px-2 py-3 text-right">
                <span className="text-[11px] font-medium text-gray-400">
                  {format(hour, "h a")}
                </span>
              </div>

              {/* Day columns for this hour */}
              {days.map((day) => {
                const hourPosts = postsByDayHour.get(`${format(day, "yyyy-MM-dd")}_${hour.getHours()}`) ?? [];
                return (
                  <DroppableCell
                    key={`${day.toISOString()}-${hour.toISOString()}`}
                    id={`${day.toISOString()}_${hour.getHours()}`}
                    className={cn(
                      "min-h-[48px] border-b border-r border-gray-100 p-0.5 last:border-r-0",
                      isSameDay(day, today) && "bg-indigo-50/30"
                    )}
                  >
                    {hourPosts.map((post) => (
                      <DraggablePostCard key={post.id} post={post} />
                    ))}
                  </DroppableCell>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
