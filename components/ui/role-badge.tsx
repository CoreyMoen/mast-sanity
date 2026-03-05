import { cn } from "@/lib/utils";

const roleStyles = {
  owner: "bg-amber-100 text-amber-700",
  admin: "bg-purple-100 text-purple-700",
  editor: "bg-blue-100 text-blue-700",
  creator: "bg-green-100 text-green-700",
  viewer: "bg-gray-100 text-gray-700",
} as const;

type RoleBadgeRole = keyof typeof roleStyles;

interface RoleBadgeProps {
  role: RoleBadgeRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        roleStyles[role],
        className,
      )}
    >
      {role}
    </span>
  );
}
