"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | null>(null);

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TOAST_DURATION = 5000;

const typeConfig: Record<
  ToastType,
  { icon: typeof CheckCircle; bg: string; border: string; text: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle,
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    iconColor: "text-green-500",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    iconColor: "text-red-500",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    iconColor: "text-blue-500",
  },
};

// ---------------------------------------------------------------------------
// Individual toast
// ---------------------------------------------------------------------------

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const config = typeConfig[toast.type];
  const Icon = config.icon;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on next frame
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      // Wait for exit animation before removing
      setTimeout(() => onDismiss(toast.id), 200);
    }, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  function handleDismiss() {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 200);
  }

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex w-80 items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-200",
        config.bg,
        config.border,
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-4 opacity-0"
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.iconColor)} />
      <p className={cn("flex-1 text-sm font-medium", config.text)}>
        {toast.message}
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className={cn(
          "shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5",
          config.text
        )}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    idCounter.current += 1;
    const id = `toast-${idCounter.current}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const contextValue: ToastContextValue = useMemo(() => ({
    toast: {
      success: (message: string) => addToast("success", message),
      error: (message: string) => addToast("error", message),
      info: (message: string) => addToast("info", message),
    },
  }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast container — bottom-right */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast(): ToastContextValue["toast"] {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx.toast;
}
