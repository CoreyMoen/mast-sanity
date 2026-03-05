/**
 * OnboardingStep — Reusable wrapper for each onboarding wizard step.
 *
 * Renders a progress bar with step indicators, content area, and
 * navigation buttons (back, skip, next/finish).
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStepProps {
  /** Current step (1-indexed) */
  step: number;
  /** Total number of steps */
  totalSteps: number;
  /** Step title displayed above content */
  title: string;
  /** Short description below the title */
  description?: string;
  /** Step content */
  children: React.ReactNode;
  /** Called when the user advances to the next step */
  onNext?: () => void;
  /** Called when the user goes back to the previous step */
  onBack?: () => void;
  /** Called when the user skips the current step */
  onSkip?: () => void;
  /** Label for the next/continue button */
  nextLabel?: string;
  /** Label for the back button */
  backLabel?: string;
  /** Whether the next button should be disabled */
  nextDisabled?: boolean;
}

const STEP_LABELS = ["Welcome", "Accounts", "AI Setup", "First Post", "Done"];

export function OnboardingStep({
  step,
  totalSteps,
  title,
  description,
  children,
  onNext,
  onBack,
  onSkip,
  nextLabel = "Continue",
  backLabel = "Back",
  nextDisabled = false,
}: OnboardingStepProps) {
  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">
            Step {step} of {totalSteps}
          </span>
          <span className="text-xs font-medium text-gray-500">
            {STEP_LABELS[step - 1] ?? ""}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="mt-3 flex items-center justify-between px-1">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < step;
            const isCurrent = stepNum === step;
            return (
              <div key={stepNum} className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isCompleted
                      ? "bg-indigo-600 text-white"
                      : isCurrent
                        ? "border-2 border-indigo-600 bg-white text-indigo-600"
                        : "border-2 border-gray-300 bg-white text-gray-400",
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Title and description */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-sm text-gray-500">{description}</p>
          )}
        </div>

        {/* Step content */}
        <div className="mb-8">{children}</div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
                {backLabel}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
              >
                Skip
              </button>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors",
                  nextDisabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-indigo-700",
                )}
              >
                {nextLabel}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
