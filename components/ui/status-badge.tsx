import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  string,
  { label: string; dotColor: string; bgColor: string; textColor: string }
> = {
  draft: {
    label: "Draft",
    dotColor: "bg-gray-400",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
  },
  pending_approval: {
    label: "Pending Approval",
    dotColor: "bg-amber-400",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
  },
  approved: {
    label: "Approved",
    dotColor: "bg-green-400",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
  },
  rejected: {
    label: "Rejected",
    dotColor: "bg-red-400",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
  },
  changes_requested: {
    label: "Changes Requested",
    dotColor: "bg-orange-400",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
  },
  scheduled: {
    label: "Scheduled",
    dotColor: "bg-indigo-400",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
  },
  publishing: {
    label: "Publishing",
    dotColor: "bg-blue-400",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
  },
  published: {
    label: "Published",
    dotColor: "bg-green-400",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
  },
  failed: {
    label: "Failed",
    dotColor: "bg-red-400",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    dotColor: "bg-gray-400",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  );
}
