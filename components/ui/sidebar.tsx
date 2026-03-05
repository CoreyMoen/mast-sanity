"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  BarChart3,
  ImageIcon,
  Link as LinkIcon,
  Users,
  CheckSquare,
  Settings,
  Repeat,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { label: "Posts", href: "/dashboard/posts", icon: FileText },
  { label: "Recurring", href: "/dashboard/posts/recurring", icon: Repeat },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Media", href: "/dashboard/media", icon: ImageIcon },
  { label: "Accounts", href: "/dashboard/accounts", icon: LinkIcon },
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Approvals", href: "/dashboard/approvals", icon: CheckSquare },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    // For nested routes like /dashboard/posts vs /dashboard/posts/recurring,
    // prefer the more specific match by checking if a more specific nav item
    // also matches. If so, only match the more specific one.
    if (pathname.startsWith(href)) {
      const moreSpecific = navItems.some(
        (item) =>
          item.href !== href &&
          item.href.startsWith(href) &&
          pathname.startsWith(item.href),
      );
      return !moreSpecific;
    }
    return false;
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center px-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-indigo-600"
            onClick={onClose}
          >
            Angela
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
                      active
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-200 px-4 py-4">
          <div className="flex items-center gap-3 min-h-[44px]">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
            <span className="text-sm font-medium text-gray-700">Account</span>
          </div>
        </div>
      </aside>
    </>
  );
}
