"use client";

import { useState, useCallback } from "react";
import {
  Repeat,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  Zap,
} from "lucide-react";
import { UpgradeGate } from "@/components/ui/upgrade-gate";
import { RecurringRuleCard } from "@/components/recurring/recurring-rule-card";
import { RecurringRuleForm } from "@/components/recurring/recurring-rule-form";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/ui/toast";

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = "list" | "create" | "edit";

interface RuleFormData {
  frequency: string;
  customIntervalDays?: number;
  endType: string;
  endAfterCount?: number;
  endOnDate?: string;
  nextOccurrence: number;
  templateContent: string;
  templatePlatforms: string[];
  templateHashtags?: string[];
  templateMediaIds?: string[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RecurringPostsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Convex queries and mutations
  const rawRules = useQuery(api.recurringPosts.list);
  const user = useQuery(api.users.getMe);
  const createRule = useMutation(api.recurringPosts.create);
  const updateRule = useMutation(api.recurringPosts.update);
  const activateRule = useMutation(api.recurringPosts.activate);
  const deactivateRule = useMutation(api.recurringPosts.deactivate);
  const removeRule = useMutation(api.recurringPosts.remove);

  const rules = rawRules ?? [];
  const userTier = user?.subscriptionTier ?? "free";

  const activeRules = rules.filter((r) => r.isActive);
  const pausedRules = rules.filter((r) => !r.isActive);
  const editingRule = editingRuleId
    ? rules.find((r) => r._id === editingRuleId) ?? null
    : null;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleToggleActive = useCallback(
    async (ruleId: string, isActive: boolean) => {
      try {
        if (isActive) {
          await activateRule({ ruleId: ruleId as Id<"recurringRules"> });
        } else {
          await deactivateRule({ ruleId: ruleId as Id<"recurringRules"> });
        }
        toast.success(isActive ? "Rule resumed." : "Rule paused.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to toggle rule.",
        );
      }
    },
    [activateRule, deactivateRule, toast],
  );

  const handleEdit = useCallback(
    (ruleId: string) => {
      setEditingRuleId(ruleId);
      setViewMode("edit");
    },
    [],
  );

  const handleDelete = useCallback(
    async (ruleId: string) => {
      try {
        await removeRule({ ruleId: ruleId as Id<"recurringRules"> });
        toast.success("Rule deleted.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete rule.",
        );
      }
    },
    [removeRule, toast],
  );

  const handleCreateSave = useCallback(
    async (data: RuleFormData) => {
      setIsSubmitting(true);
      try {
        await createRule({
          frequency: data.frequency,
          customIntervalDays: data.customIntervalDays,
          endType: data.endType,
          endAfterCount: data.endAfterCount,
          endOnDate: data.endOnDate,
          nextOccurrence: data.nextOccurrence,
          templateContent: data.templateContent,
          templatePlatforms: data.templatePlatforms,
          templateHashtags: data.templateHashtags ?? [],
          templateMediaIds: data.templateMediaIds ?? [],
        });
        setViewMode("list");
        toast.success("Recurring rule created successfully.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to create rule.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [createRule, toast],
  );

  const handleEditSave = useCallback(
    async (data: RuleFormData) => {
      if (!editingRuleId) return;
      setIsSubmitting(true);
      try {
        await updateRule({
          ruleId: editingRuleId as Id<"recurringRules">,
          frequency: data.frequency,
          customIntervalDays: data.customIntervalDays,
          endType: data.endType,
          endAfterCount: data.endAfterCount,
          endOnDate: data.endOnDate,
          nextOccurrence: data.nextOccurrence,
          templateContent: data.templateContent,
          templatePlatforms: data.templatePlatforms,
          templateHashtags: data.templateHashtags,
          templateMediaIds: data.templateMediaIds,
        });
        setViewMode("list");
        setEditingRuleId(null);
        toast.success("Recurring rule updated successfully.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update rule.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingRuleId, updateRule, toast],
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <UpgradeGate feature="recurringPosts" tier={userTier}>
      <div className="mx-auto max-w-5xl">
        {/* ─── List View ──────────────────────────────────────────────────── */}
        {viewMode === "list" && (
          <>
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Repeat className="h-7 w-7 text-indigo-600" />
                  <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                    Recurring Posts
                  </h1>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Automate your content schedule with recurring posts that
                  publish on a set cadence.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewMode("create")}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Create Recurring Post
              </button>
            </div>

            {/* Rule list or empty state */}
            <div className="mt-6 pb-20">
              {rawRules === undefined || rawRules === null ? (
                <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  <span className="ml-3 text-sm text-gray-500">Loading recurring rules...</span>
                </div>
              ) : rules.length === 0 ? (
                /* Empty state */
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                    <Repeat className="h-7 w-7 text-indigo-500" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-gray-900">
                    No recurring posts yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                    Recurring posts let you automatically schedule content on
                    a regular cadence -- daily, weekly, monthly, or on a
                    custom interval. Set it once and let Angela handle the
                    rest.
                  </p>

                  <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-4 text-left">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <Calendar className="h-5 w-5 text-indigo-500" />
                      <p className="mt-2 text-xs font-medium text-gray-700">
                        Flexible Scheduling
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        Daily, weekly, monthly, or custom intervals
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <Zap className="h-5 w-5 text-indigo-500" />
                      <p className="mt-2 text-xs font-medium text-gray-700">
                        Auto-Publish
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        Posts are created and scheduled automatically
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <Clock className="h-5 w-5 text-indigo-500" />
                      <p className="mt-2 text-xs font-medium text-gray-700">
                        Smart Timing
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        Set time of day and timezone for each rule
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewMode("create")}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Recurring Post
                  </button>
                </div>
              ) : (
                <>
                  {/* Active rules */}
                  {activeRules.length > 0 && (
                    <div>
                      <h2 className="mb-3 text-sm font-semibold text-gray-700">
                        Active Rules ({activeRules.length})
                      </h2>
                      <div className="space-y-4">
                        {activeRules.map((rule) => (
                          <RecurringRuleCard
                            key={rule._id}
                            rule={rule}
                            onToggleActive={handleToggleActive}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Paused rules */}
                  {pausedRules.length > 0 && (
                    <div className={activeRules.length > 0 ? "mt-8" : ""}>
                      <h2 className="mb-3 text-sm font-semibold text-gray-500">
                        Paused Rules ({pausedRules.length})
                      </h2>
                      <div className="space-y-4">
                        {pausedRules.map((rule) => (
                          <RecurringRuleCard
                            key={rule._id}
                            rule={rule}
                            onToggleActive={handleToggleActive}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ─── Create View ────────────────────────────────────────────────── */}
        {viewMode === "create" && (
          <>
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Recurring Posts
              </button>
              <div className="flex items-center gap-3">
                <Repeat className="h-7 w-7 text-indigo-600" />
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Create Recurring Post
                </h1>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Set up a post template and schedule to automatically create
                posts on a recurring basis.
              </p>
            </div>

            <div className="pb-20">
              <RecurringRuleForm
                onSave={handleCreateSave}
                onCancel={() => setViewMode("list")}
                isSubmitting={isSubmitting}
              />
            </div>
          </>
        )}

        {/* ─── Edit View ──────────────────────────────────────────────────── */}
        {viewMode === "edit" && editingRule && (
          <>
            <div className="mb-6">
              <button
                type="button"
                onClick={() => {
                  setViewMode("list");
                  setEditingRuleId(null);
                }}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Recurring Posts
              </button>
              <div className="flex items-center gap-3">
                <Repeat className="h-7 w-7 text-indigo-600" />
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Edit Recurring Post
                </h1>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Update the template, schedule, or platforms for this recurring
                post rule.
              </p>
            </div>

            <div className="pb-20">
              <RecurringRuleForm
                initialData={{
                  frequency: editingRule.frequency,
                  customIntervalDays: editingRule.customIntervalDays,
                  endType: editingRule.endType,
                  endAfterCount: editingRule.endAfterCount,
                  endOnDate: editingRule.endOnDate,
                  nextOccurrence: editingRule.nextOccurrence,
                  templateContent: editingRule.templateContent,
                  templatePlatforms: editingRule.templatePlatforms,
                  templateHashtags: editingRule.templateHashtags,
                }}
                onSave={handleEditSave}
                onCancel={() => {
                  setViewMode("list");
                  setEditingRuleId(null);
                }}
                isSubmitting={isSubmitting}
              />
            </div>
          </>
        )}
      </div>
    </UpgradeGate>
  );
}
