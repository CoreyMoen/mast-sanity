import { cn } from "@/lib/utils";

const PLATFORM_CONFIG: Record<
  string,
  { label: string; bgColor: string; textColor: string; abbr: string }
> = {
  instagram: {
    label: "Instagram",
    bgColor: "bg-gradient-to-r from-purple-500 to-pink-500",
    textColor: "text-white",
    abbr: "IG",
  },
  facebook: {
    label: "Facebook",
    bgColor: "bg-blue-600",
    textColor: "text-white",
    abbr: "FB",
  },
  twitter: {
    label: "X",
    bgColor: "bg-gray-900",
    textColor: "text-white",
    abbr: "X",
  },
  linkedin: {
    label: "LinkedIn",
    bgColor: "bg-blue-700",
    textColor: "text-white",
    abbr: "LI",
  },
};

interface PlatformBadgeProps {
  platform: string;
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const config = PLATFORM_CONFIG[platform] ?? {
    label: platform,
    bgColor: "bg-gray-500",
    textColor: "text-white",
    abbr: platform.slice(0, 2).toUpperCase(),
  };

  return (
    <span
      title={config.label}
      className={cn(
        "inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold leading-none",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {config.abbr}
    </span>
  );
}
