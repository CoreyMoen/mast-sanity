"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { Sparkles, X, Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const pathname = usePathname();
  const connectedAccounts = useQuery(api.socialAccounts.list);

  // Wait for Convex auth to sync with Clerk before calling ensureUser
  const { isAuthenticated } = useConvexAuth();
  const ensureUser = useMutation(api.users.ensureUser);
  const ensuredRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !ensuredRef.current) {
      ensuredRef.current = true;
      ensureUser().catch((err) => {
        // Reset ref so it retries on next render
        ensuredRef.current = false;
        console.error("ensureUser failed:", err);
      });
    }
  }, [isAuthenticated, ensureUser]);

  const user = useQuery(api.users.getMe);

  // Gate: don't render any dashboard content until the user record is confirmed
  const userReady = user !== undefined && user !== null;

  // Show the onboarding banner if the user hasn't completed onboarding,
  // has no connected accounts, is not on the onboarding page, and hasn't
  // dismissed the banner. Having a connected account means setup is effectively done.
  const hasConnectedAccount =
    connectedAccounts && connectedAccounts.some((a: { isActive: boolean }) => a.isActive);
  const showOnboardingBanner =
    userReady &&
    !user.onboardingCompleted &&
    !hasConnectedAccount &&
    !pathname.startsWith("/dashboard/onboarding") &&
    !bannerDismissed;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Onboarding reminder banner */}
        {showOnboardingBanner && (
          <div className="border-b border-indigo-200 bg-indigo-50 px-4 py-2.5 sm:px-6">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">
                  Complete your setup to get the most out of Angela.
                </span>
                <Link
                  href="/dashboard/onboarding"
                  className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  Continue Setup
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-indigo-400 transition-colors hover:bg-indigo-100 hover:text-indigo-600"
                aria-label="Dismiss onboarding banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {userReady ? (
            children
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
                <p className="mt-3 text-sm text-gray-500">
                  Loading your workspace...
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
