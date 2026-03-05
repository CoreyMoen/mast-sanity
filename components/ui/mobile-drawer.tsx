"use client";

import { useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileDrawerProps {
  /** Whether the drawer is open. */
  isOpen: boolean;
  /** Called when the drawer should close (backdrop click, drag down, close button). */
  onClose: () => void;
  /** Optional title displayed in the drawer header. */
  title?: string;
  /** Content rendered inside the drawer body. */
  children: React.ReactNode;
}

/**
 * MobileDrawer -- A reusable bottom sheet / drawer component for mobile.
 *
 * Slides up from the bottom of the screen. Includes a drag handle at the top,
 * a backdrop overlay, and a close button. Hidden on lg+ breakpoints.
 */
export function MobileDrawer({
  isOpen,
  onClose,
  title,
  children,
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef(0);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Drag-to-dismiss handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    currentTranslateY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null || !drawerRef.current) return;
    const deltaY = e.touches[0].clientY - dragStartY.current;
    // Only allow dragging down (positive deltaY)
    if (deltaY > 0) {
      currentTranslateY.current = deltaY;
      drawerRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!drawerRef.current) return;
    // If dragged more than 100px down, close the drawer
    if (currentTranslateY.current > 100) {
      onClose();
    }
    // Reset position
    drawerRef.current.style.transform = "";
    dragStartY.current = null;
    currentTranslateY.current = 0;
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Drawer"}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-xl",
          "animate-slide-up",
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 pb-3 pt-1">
          {title ? (
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
