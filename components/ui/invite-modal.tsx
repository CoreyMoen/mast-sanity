"use client";

import { useState } from "react";
import { X, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidEmail } from "@/lib/utils/validation";

const ROLES = [
  {
    value: "admin",
    label: "Admin",
    description: "Full access — can approve/reject posts, manage team, billing",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Can create, edit, and approve posts",
  },
  {
    value: "creator",
    label: "Creator",
    description: "Can create and edit own posts, submit for approval",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access to calendar and analytics",
  },
] as const;

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<void>;
}

export function InviteModal({ open, onClose, onInvite }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const selectedRole = ROLES.find((r) => r.value === role);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await onInvite(email, role);
      setEmail("");
      setRole("editor");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Invite Team Member
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Email field */}
          <div>
            <label
              htmlFor="invite-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              className={cn(
                "mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400",
                error
                  ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
              )}
              disabled={loading}
            />
            {error && (
              <p className="mt-1.5 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Role selector */}
          <div>
            <label
              htmlFor="invite-role"
              className="block text-sm font-medium text-gray-700"
            >
              Role
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {selectedRole && (
              <p className="mt-1.5 text-sm text-gray-500">
                {selectedRole.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 sm:min-h-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 sm:min-h-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invite"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
