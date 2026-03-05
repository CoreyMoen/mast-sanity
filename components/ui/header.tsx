"use client";

import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/ui/notification-bell";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile brand */}
      <span className="text-lg font-bold tracking-tight text-indigo-600 lg:hidden">
        Angela
      </span>

      {/* Spacer to push right-side items to the end */}
      <div className="flex-1" />

      {/* Right-side actions */}
      <div className="flex items-center gap-2">
        <NotificationBell />
      </div>
    </header>
  );
}
