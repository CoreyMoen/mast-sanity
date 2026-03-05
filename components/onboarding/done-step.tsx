/**
 * DoneStep — Final step of the onboarding wizard.
 *
 * Shows a celebration screen with quick tips and links to key features.
 */

"use client";

import Link from "next/link";
import {
  PartyPopper,
  Calendar,
  FileText,
  Link as LinkIcon,
  Settings,
} from "lucide-react";

const QUICK_LINKS = [
  {
    icon: FileText,
    label: "Create a Post",
    description: "Compose and schedule your content",
    href: "/dashboard/posts/new",
  },
  {
    icon: Calendar,
    label: "View Calendar",
    description: "See your scheduled posts at a glance",
    href: "/dashboard/calendar",
  },
  {
    icon: LinkIcon,
    label: "Manage Accounts",
    description: "Connect more social media profiles",
    href: "/dashboard/accounts",
  },
  {
    icon: Settings,
    label: "Settings",
    description: "Customize your AI provider and plan",
    href: "/dashboard/settings",
  },
];

export function DoneStep() {
  return (
    <div className="space-y-8">
      {/* Celebration */}
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
          <PartyPopper className="h-10 w-10 text-indigo-600" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-gray-900">
          You&apos;re all set!
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Your Angela account is ready to go. Here are some things you can do
          next.
        </p>
      </div>

      {/* Quick tips */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
        <h4 className="text-sm font-semibold text-indigo-900">Quick Tips</h4>
        <ul className="mt-2 space-y-1.5 text-sm text-indigo-700">
          <li>-- Use AI Assist in the composer to generate captions instantly</li>
          <li>-- Schedule posts at optimal times using the calendar view</li>
          <li>-- Check analytics regularly to see what resonates with your audience</li>
        </ul>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <link.icon className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-gray-900">
                {link.label}
              </h5>
              <p className="mt-0.5 text-xs text-gray-500">
                {link.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
