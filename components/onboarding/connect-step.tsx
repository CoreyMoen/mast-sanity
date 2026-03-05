/**
 * ConnectStep — Second step of the onboarding wizard.
 *
 * Prompts the user to connect at least one social media account.
 * Reuses the PlatformCard component and shows connection status.
 */

"use client";

import { useCallback, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PlatformCard } from "@/components/ui/platform-card";
import { CheckCircle2 } from "lucide-react";

const PLATFORMS = [
  { id: "instagram" as const, label: "Instagram" },
  { id: "facebook" as const, label: "Facebook" },
  { id: "twitter" as const, label: "X (Twitter)" },
  { id: "linkedin" as const, label: "LinkedIn" },
] as const;

export function ConnectStep() {
  const accounts = useQuery(api.socialAccounts.list);
  const disconnectAccount = useMutation(api.socialAccounts.disconnect);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const getConnectedAccount = useCallback(
    (platformId: string) => {
      if (!accounts) return null;
      return (
        accounts.find(
          (account) => account.platform === platformId && account.isActive,
        ) ?? null
      );
    },
    [accounts],
  );

  const connectedCount = accounts?.filter((a) => a.isActive).length ?? 0;
  const isLoading = accounts === undefined || accounts === null;

  const handleConnect = useCallback((platform: string) => {
    window.location.href = `/api/oauth/${platform}`;
  }, []);

  const handleDisconnect = useCallback(
    async (accountId: Id<"socialAccounts">) => {
      setDisconnectingId(accountId);
      try {
        await disconnectAccount({ accountId });
      } catch (err) {
        console.error("Failed to disconnect account:", err);
      } finally {
        setDisconnectingId(null);
      }
    },
    [disconnectAccount],
  );

  return (
    <div className="space-y-6">
      {/* Status indicator */}
      <div className="flex items-center justify-center gap-2">
        {connectedCount > 0 ? (
          <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            {connectedCount} account{connectedCount !== 1 ? "s" : ""} connected
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No accounts connected yet. Connect at least one to get started.
          </p>
        )}
      </div>

      {/* Platform cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {isLoading
          ? PLATFORMS.map((platform) => (
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
                />
              );
            })}
      </div>
    </div>
  );
}
