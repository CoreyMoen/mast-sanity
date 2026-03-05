import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-indigo-600 border-t-transparent",
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface FullPageSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export function FullPageSpinner({
  size = "lg",
  message,
}: FullPageSpinnerProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <LoadingSpinner size={size} />
      {message && (
        <p className="text-sm font-medium text-gray-500">{message}</p>
      )}
    </div>
  );
}
