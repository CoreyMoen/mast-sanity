"use client";

import { useDroppable, useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export interface CalendarPost {
  id: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledAt: Date;
  platforms: string[];
}

interface CalendarDayProps {
  date: Date;
  posts: CalendarPost[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const STATUS_COLORS: Record<CalendarPost["status"], string> = {
  draft: "bg-gray-400",
  scheduled: "bg-indigo-500",
  published: "bg-green-500",
  failed: "bg-red-500",
};

const STATUS_TEXT_COLORS: Record<CalendarPost["status"], string> = {
  draft: "text-gray-600",
  scheduled: "text-indigo-700",
  published: "text-green-700",
  failed: "text-red-700",
};

const STATUS_BG_COLORS: Record<CalendarPost["status"], string> = {
  draft: "bg-gray-50",
  scheduled: "bg-indigo-50",
  published: "bg-green-50",
  failed: "bg-red-50",
};

// ---------------------------------------------------------------------------
// Draggable post pill — only "scheduled" posts can be dragged
// ---------------------------------------------------------------------------

function DraggablePostPill({ post }: { post: CalendarPost }) {
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
        "flex items-center gap-1 rounded px-1 py-0.5 sm:px-1.5",
        STATUS_BG_COLORS[post.status],
        isDraggable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          STATUS_COLORS[post.status]
        )}
      />
      <span
        className={cn(
          "hidden truncate text-[11px] font-medium leading-tight sm:block",
          STATUS_TEXT_COLORS[post.status]
        )}
      >
        {post.content.length > 30
          ? post.content.slice(0, 30) + "..."
          : post.content}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar day cell — acts as a drop target
// ---------------------------------------------------------------------------

export function CalendarDay({
  date,
  posts,
  isCurrentMonth,
  isToday,
  isSelected,
  onClick,
}: CalendarDayProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: date.toISOString(),
  });

  const visiblePosts = posts.slice(0, 3);
  const overflowCount = posts.length - 3;

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex min-h-[72px] flex-col rounded-lg border p-1 text-left transition-colors sm:min-h-[100px] sm:p-1.5",
        isCurrentMonth
          ? "border-gray-200 bg-white hover:bg-gray-50"
          : "border-gray-100 bg-gray-50/50",
        isToday && "ring-2 ring-indigo-600 ring-offset-1",
        isSelected && !isToday && "ring-2 ring-indigo-300 ring-offset-1",
        isOver && "ring-2 ring-indigo-400 bg-indigo-50/50"
      )}
    >
      {/* Day number */}
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:h-7 sm:w-7 sm:text-sm",
          isToday && "bg-indigo-600 text-white",
          !isToday && isCurrentMonth && "text-gray-900",
          !isToday && !isCurrentMonth && "text-gray-400"
        )}
      >
        {date.getDate()}
      </span>

      {/* Post pills */}
      <div className="mt-0.5 flex flex-col gap-0.5 overflow-hidden sm:mt-1">
        {visiblePosts.map((post) => (
          <DraggablePostPill key={post.id} post={post} />
        ))}

        {overflowCount > 0 && (
          <span className="px-1.5 text-[11px] font-medium text-gray-500">
            +{overflowCount} more
          </span>
        )}
      </div>
    </div>
  );
}
