/**
 * WelcomeStep — First step of the onboarding wizard.
 *
 * Shows a personalized greeting, brief intro to Angela, and three
 * quick feature highlights with icons.
 */

"use client";

import { Sparkles, Calendar, BarChart3 } from "lucide-react";

interface WelcomeStepProps {
  /** User's first name from Clerk */
  firstName: string;
}

const FEATURES = [
  {
    icon: Calendar,
    title: "Schedule Across Platforms",
    description:
      "Plan and schedule posts for Instagram, Facebook, X, and LinkedIn from one place.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Captions",
    description:
      "Generate and rewrite captions using your preferred AI provider. Bring your own API key.",
  },
  {
    icon: BarChart3,
    title: "Track Performance",
    description:
      "Monitor engagement metrics across all your connected accounts in one dashboard.",
  },
];

export function WelcomeStep({ firstName }: WelcomeStepProps) {
  return (
    <div className="space-y-8">
      {/* Logo and greeting */}
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100">
          <span className="text-3xl font-bold text-indigo-600">A</span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Welcome to Angela, {firstName}!
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Let&apos;s get you set up in just a few minutes. You can always come
          back and change these settings later.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="space-y-4">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
              <feature.icon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                {feature.title}
              </h4>
              <p className="mt-0.5 text-sm text-gray-500">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
