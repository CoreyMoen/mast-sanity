"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  Edit3,
  Trash2,
  ChevronDown,
  Info,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TIER_LIMITS } from "@/lib/utils/validation";
import { RoleBadge } from "@/components/ui/role-badge";
import { InviteModal } from "@/components/ui/invite-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { useToast } from "@/components/ui/toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MemberRole = "admin" | "editor" | "creator" | "viewer";

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  imageUrl?: string;
  role: MemberRole;
  isOwner: boolean;
  isCurrentUser: boolean;
  joinedAt: number;
}

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "creator", label: "Creator" },
  { value: "viewer", label: "Viewer" },
];

const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  admin: "Full access \u2014 can approve/reject posts, manage team, billing",
  editor: "Can create, edit, and approve posts",
  creator: "Can create and edit own posts, submit for approval",
  viewer: "Read-only access to calendar and analytics",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TeamPage() {
  // ---- Convex data --------------------------------------------------------
  const user = useQuery(api.users.getMe);
  const orgData = useQuery(api.orgMembers.listMyOrgMembers);
  const changeRoleMutation = useMutation(api.orgMembers.changeRole);
  const removeMemberMutation = useMutation(api.orgMembers.removeMember);

  const toast = useToast();

  // ---- Local UI state -----------------------------------------------------
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);
  const [rolesInfoOpen, setRolesInfoOpen] = useState(false);

  // ---- Derive tier from user's actual subscription ------------------------
  const currentTier = (user?.subscriptionTier ?? "free") as keyof typeof TIER_LIMITS;
  const tierLimit = TIER_LIMITS[currentTier].teamMembers;
  const isFreeTier = currentTier === "free";

  // ---- Members from Convex query ------------------------------------------
  const members = (orgData?.members ?? []) as TeamMember[];
  const currentUserRole = orgData?.currentUserRole ?? "viewer";
  const isAdmin = currentUserRole === "admin";

  // ---- Loading state ------------------------------------------------------
  if (user === undefined || user === null || orgData === undefined || orgData === null) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-indigo-600" />
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Team
          </h1>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Manage your team members, roles, and permissions.
        </p>
        <div className="mt-8">
          <ListSkeleton rows={3} />
        </div>
      </div>
    );
  }

  // ---- Handlers -----------------------------------------------------------

  async function handleInvite(email: string, role: string) {
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to send invite");
      }

      toast.success(`Invitation sent to ${email}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite.");
    }
  }

  async function handleRoleChange(memberId: string, newRole: MemberRole) {
    setRoleDropdownOpen(null);

    // If the user has no org (solo mode), role changes are not available
    if (!orgData?.orgId) return;

    try {
      await changeRoleMutation({
        memberId: memberId as Id<"orgMembers">,
        newRole,
      });
      toast.success(`Role updated to ${newRole}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change role. Please try again."
      );
    }
  }

  async function handleRemove(memberId: string) {
    // If the user has no org (solo mode), removal is not available
    if (!orgData?.orgId) return;

    try {
      await removeMemberMutation({
        memberId: memberId as Id<"orgMembers">,
      });
      toast.success("Team member removed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member. Please try again."
      );
    }
  }

  // ---- Render -------------------------------------------------------------

  return (
    <div className="mx-auto max-w-5xl">
      {/* ---- Upgrade banner (free tier) --------------------------------- */}
      {isFreeTier && (
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Unlock Team Collaboration
              </h3>
              <p className="mt-1 text-sm text-indigo-100">
                Upgrade to Pro (up to 3 members) or Business (up to 15 members)
                to invite your team and collaborate on content.
              </p>
            </div>
            <button className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm transition-colors hover:bg-indigo-50 sm:w-auto">
              Upgrade Now
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---- Header ----------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-indigo-600" />
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Team
          </h1>
          <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-sm font-medium text-indigo-700">
            {members.length}/{tierLimit === Infinity ? "\u221E" : tierLimit}{" "}
            members
          </span>
        </div>

        <button
          onClick={() => setInviteOpen(true)}
          disabled={isFreeTier || !isAdmin}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      <p className="mt-2 text-sm text-gray-500">
        Manage your team members, roles, and permissions.
      </p>

      {/* ---- Roles info panel ------------------------------------------- */}
      <div className="mt-6">
        <button
          onClick={() => setRolesInfoOpen(!rolesInfoOpen)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
        >
          <Info className="h-4 w-4" />
          Role Permissions
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              rolesInfoOpen && "rotate-180",
            )}
          />
        </button>

        {rolesInfoOpen && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.entries(ROLE_DESCRIPTIONS) as [MemberRole, string][]).map(
              ([role, description]) => (
                <div
                  key={role}
                  className="rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div className="mb-2">
                    <RoleBadge role={role} />
                  </div>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* ---- Member list ------------------------------------------------ */}
      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Table header */}
        <div className="hidden border-b border-gray-100 bg-gray-50/50 px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
          <span className="col-span-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Member
          </span>
          <span className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Role
          </span>
          <span className="col-span-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Joined
          </span>
          <span className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Actions
          </span>
        </div>

        {/* Members */}
        <ul className="divide-y divide-gray-100">
          {members.map((member) => (
            <li key={member.id} className="relative px-6 py-4">
              <div className="flex flex-col gap-3 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4">
                {/* Avatar + info */}
                <div className="col-span-5 flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      member.isOwner
                        ? "bg-amber-100 text-amber-700"
                        : "bg-indigo-100 text-indigo-700",
                    )}
                  >
                    {getInitials(member.name)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {member.name}
                      </span>
                      {member.isCurrentUser && (
                        <span className="shrink-0 text-xs text-gray-400">
                          (You)
                        </span>
                      )}
                      {member.isOwner && (
                        <Crown className="h-4 w-4 shrink-0 text-amber-500" />
                      )}
                    </div>
                    <p className="truncate text-sm text-gray-500">
                      {member.email}
                    </p>
                  </div>
                </div>

                {/* Role badge */}
                <div className="col-span-2 flex items-center gap-2">
                  {member.isOwner ? (
                    <RoleBadge role="owner" />
                  ) : (
                    <RoleBadge role={member.role} />
                  )}
                </div>

                {/* Joined date */}
                <div className="col-span-3">
                  <span className="text-sm text-gray-500">
                    {formatDate(member.joinedAt)}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center gap-2">
                  {!member.isOwner && !member.isCurrentUser && isAdmin ? (
                    <>
                      {/* Role change dropdown */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setRoleDropdownOpen(
                              roleDropdownOpen === member.id
                                ? null
                                : member.id,
                            )
                          }
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:min-h-0"
                          title="Change role"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <ChevronDown className="h-3 w-3" />
                        </button>

                        {roleDropdownOpen === member.id && (
                          <>
                            {/* Clickaway overlay */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setRoleDropdownOpen(null)}
                            />
                            <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                              {ROLE_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() =>
                                    handleRoleChange(member.id, option.value)
                                  }
                                  className={cn(
                                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50",
                                    member.role === option.value
                                      ? "bg-indigo-50 font-medium text-indigo-700"
                                      : "text-gray-700",
                                  )}
                                >
                                  {option.label}
                                  {member.role === option.value && (
                                    <Shield className="ml-auto h-3.5 w-3.5 text-indigo-500" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:h-auto sm:w-auto sm:p-1.5"
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {member.isOwner ? "Owner" : "\u2014"}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Empty state */}
        {members.length === 0 && (
          <EmptyState
            icon={Users}
            title="No team members yet"
            description="Invite someone to collaborate on your social media content."
            actionLabel={!isFreeTier && isAdmin ? "Invite Member" : undefined}
            onAction={!isFreeTier && isAdmin ? () => setInviteOpen(true) : undefined}
            className="border-0 rounded-none shadow-none"
          />
        )}
      </div>

      {/* ---- Invite modal ----------------------------------------------- */}
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}
