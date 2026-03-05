"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Link as LinkIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PlatformCard } from "@/components/ui/platform-card";
import { useToast } from "@/components/ui/toast";
import { TIER_LIMITS } from "@/lib/utils/validation";

/**
 * Platform configuration for the accounts page.
 * The order here determines display order in the grid.
 */
const PLATFORMS = [
  { id: "instagram" as const, label: "Instagram" },
  { id: "facebook" as const, label: "Facebook" },
  { id: "twitter" as const, label: "X (Twitter)" },
  { id: "linkedin" as const, label: "LinkedIn" },
] as const;


export default function AccountsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Convex queries and mutations
  const accounts = useQuery(api.socialAccounts.list);
  const user = useQuery(api.users.getMe);
  const disconnectAccount = useMutation(api.socialAccounts.disconnect);

  const toast = useToast();

  // Track loading states per platform
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  // Flash messages from OAuth callback
  const successMessage = searchParams.get("success");
  const errorMessage = searchParams.get("error");
  const [showMessage, setShowMessage] = useState(true);

  // Clear URL params after showing message
  useEffect(() => {
    if (successMessage || errorMessage) {
      setShowMessage(true);
      const timer = setTimeout(() => {
        setShowMessage(false);
        // Clean URL without triggering navigation
        router.replace("/dashboard/accounts", { scroll: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage, router]);

  // Find a connected account for a given platform
  const getConnectedAccount = useCallback(
    (platformId: string) => {
      if (!accounts) return null;
      return accounts.find(
        (account: { platform: string; isActive: boolean }) => account.platform === platformId && account.isActive,
      ) ?? null;
    },
    [accounts],
  );

  // Count active connected accounts
  const connectedCount =
    accounts?.filter((a: { isActive: boolean }) => a.isActive).length ?? 0;

  // Determine account tier limit from user's actual subscription tier
  const tier = (user?.subscriptionTier ?? "free") as keyof typeof TIER_LIMITS;
  const tierLimit = TIER_LIMITS[tier].connectedAccounts;

  // Handle connect — redirect to OAuth initiation route
  const handleConnect = useCallback(
    (platform: string) => {
      window.location.href = `/api/oauth/${platform}`;
    },
    [],
  );

  // Handle disconnect
  const handleDisconnect = useCallback(
    async (accountId: Id<"socialAccounts">) => {
      setDisconnectingId(accountId);
      try {
        await disconnectAccount({ accountId });
        toast.success("Account disconnected.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to disconnect account. Please try again."
        );
      } finally {
        setDisconnectingId(null);
      }
    },
    [disconnectAccount, toast],
  );

  const isLoading = accounts === undefined || accounts === null;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <LinkIcon className="h-7 w-7 shrink-0 text-indigo-600" />
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          Connected Accounts
        </h1>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        Connect your social media accounts to start scheduling and publishing
        posts.
      </p>

      {/* Flash messages from OAuth callback */}
      {showMessage && successMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}
      {showMessage && errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Account count summary */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          {connectedCount} of {tierLimit} accounts connected
        </span>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{
              width: `${Math.min((connectedCount / tierLimit) * 100, 100)}%`,
            }}
          />
        </div>
        {connectedCount >= tierLimit && (
          <span className="text-xs text-amber-600">
            Limit reached — upgrade your plan for more accounts.
          </span>
        )}
      </div>

      {/* Platform cards grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {isLoading
          ? // Loading skeleton cards
            PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-200" />
                  <div>
                    <div className="h-4 w-24 rounded bg-gray-200" />
                    <div className="mt-1 h-3 w-16 rounded bg-gray-100" />
                  </div>
                </div>
                <div className="mt-4 h-10 rounded-lg bg-gray-100" />
                <div className="mt-4 h-9 rounded-lg bg-gray-200" />
              </div>
            ))
          : PLATFORMS.map((platform) => {
              const connected = getConnectedAccount(platform.id);
              return (
                <PlatformCard
                  key={platform.id}
                  platform={platform.id}
                  isConnected={!!connected}
                  accountName={connected?.accountName}
                  profileImageUrl={connected?.profileImageUrl}
                  onConnect={() => handleConnect(platform.id)}
                  onDisconnect={() => {
                    if (connected) {
                      handleDisconnect(connected._id);
                    }
                  }}
                  isLoading={disconnectingId === connected?._id}
                  limitReached={!connected && connectedCount >= tierLimit}
                />
              );
            })}
      </div>

      {/* Help text */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-sm font-semibold text-gray-900">
          How account connections work
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
          <li>
            -- Clicking &quot;Connect&quot; will redirect you to the platform to authorize
            Angela.
          </li>
          <li>
            -- Your credentials are encrypted and stored securely. Angela never
            sees your password.
          </li>
          <li>
            -- You can disconnect an account at any time. Scheduled posts for
            that account will not be published.
          </li>
          <li>
            -- Instagram accounts must be linked to a Facebook Page (Business or
            Creator account required).
          </li>
        </ul>
      </div>
    </div>
  );
}
