/**
 * Onboarding Page — Multi-step wizard for new users.
 *
 * Guides users through five steps:
 *   1. Welcome greeting with feature highlights
 *   2. Connect at least one social account
 *   3. AI provider and API key setup (BYOK)
 *   4. Create a first draft post
 *   5. Completion celebration with quick links
 *
 * Steps are navigable back/forward and skippable. Completing the wizard
 * (or navigating to the dashboard) marks onboarding as done in Convex.
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { OnboardingStep } from "@/components/onboarding/onboarding-step";
import { WelcomeStep } from "@/components/onboarding/welcome-step";
import { ConnectStep } from "@/components/onboarding/connect-step";
import { AiSetupStep } from "@/components/onboarding/ai-setup-step";
import { FirstPostStep } from "@/components/onboarding/first-post-step";
import { DoneStep } from "@/components/onboarding/done-step";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const convexUser = useQuery(api.users.getMe);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [currentStep, setCurrentStep] = useState(1);

  // If the user has already completed onboarding, redirect to dashboard
  const isAlreadyOnboarded = convexUser?.onboardingCompleted === true;

  const handleComplete = useCallback(async () => {
    try {
      await completeOnboarding();
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
    }
    router.push("/dashboard");
  }, [completeOnboarding, router]);

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Loading state while Clerk and Convex data load
  if (!clerkLoaded || convexUser === undefined || convexUser === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if already onboarded
  if (isAlreadyOnboarded) {
    router.push("/dashboard");
    return null;
  }

  const firstName = clerkUser?.firstName ?? "there";

  return (
    <div className="py-4 sm:py-8">
      {/* Step 1: Welcome */}
      {currentStep === 1 && (
        <OnboardingStep
          step={1}
          totalSteps={TOTAL_STEPS}
          title="Welcome to Angela!"
          description="Your social media command center. Let's get everything set up."
          onNext={goNext}
          nextLabel="Get Started"
        >
          <WelcomeStep firstName={firstName} />
        </OnboardingStep>
      )}

      {/* Step 2: Connect Accounts */}
      {currentStep === 2 && (
        <OnboardingStep
          step={2}
          totalSteps={TOTAL_STEPS}
          title="Connect Your Accounts"
          description="Link your social media profiles to start scheduling posts."
          onNext={goNext}
          onBack={goBack}
          onSkip={goNext}
          nextLabel="Continue"
        >
          <ConnectStep />
        </OnboardingStep>
      )}

      {/* Step 3: AI Setup */}
      {currentStep === 3 && (
        <OnboardingStep
          step={3}
          totalSteps={TOTAL_STEPS}
          title="Set Up AI Assistance"
          description="Choose your AI provider for caption generation and rewriting."
          onNext={goNext}
          onBack={goBack}
          onSkip={goNext}
          nextLabel="Continue"
        >
          <AiSetupStep />
        </OnboardingStep>
      )}

      {/* Step 4: Create First Post */}
      {currentStep === 4 && (
        <OnboardingStep
          step={4}
          totalSteps={TOTAL_STEPS}
          title="Create Your First Post"
          description="Try drafting a post. You can always edit or discard it later."
          onNext={goNext}
          onBack={goBack}
          onSkip={goNext}
          nextLabel="Continue"
        >
          <FirstPostStep />
        </OnboardingStep>
      )}

      {/* Step 5: All Done */}
      {currentStep === 5 && (
        <OnboardingStep
          step={5}
          totalSteps={TOTAL_STEPS}
          title="You're All Set!"
          onNext={handleComplete}
          onBack={goBack}
          nextLabel="Go to Dashboard"
        >
          <DoneStep />
        </OnboardingStep>
      )}
    </div>
  );
}
