"use client";

import * as React from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CAREER_STAGE_OPTIONS,
  CHALLENGE_OPTIONS,
  step1NameSchema,
  step2CareerStageSchema,
  step3ChallengeSchema,
  step4MonthlyGoalSchema,
} from "@/lib/validation/onboarding";
import { OnboardingShell } from "./onboarding-shell";
import { StepIndicator } from "./step-indicator";
import { ChoiceList } from "./choice-list";
import { GoalInput } from "./goal-input";
import { OnboardingFooter } from "./onboarding-footer";
import { ErrorState } from "./error-state";
import { ConfirmationSummary } from "./confirmation-summary";

export interface InitialOnboardingData {
  userEmail?: string;
  name?: string;
  careerStage?: string;
  challenge?: string;
  monthlyGoal?: string;
  onboardingStep?: number;
  onboardingCompleted?: boolean;
}

interface OnboardingFlowProps {
  initialData: InitialOnboardingData;
}

export function OnboardingFlow({ initialData }: OnboardingFlowProps) {
  // Determine initial step based on saved database progress
  const getInitialStep = (): number => {
    if (initialData.onboardingCompleted) return 5; // Show summary if completed
    const savedStep = initialData.onboardingStep || 0;
    if (savedStep >= 3 && initialData.challenge) return 4;
    if (savedStep >= 2 && initialData.careerStage) return 3;
    if (savedStep >= 1 && initialData.name) return 2;
    return 1;
  };

  const [currentStep, setCurrentStep] = React.useState<number>(getInitialStep);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [networkError, setNetworkError] = React.useState<string | null>(null);

  // Form State
  const [name, setName] = React.useState(initialData.name || "");
  const [careerStage, setCareerStage] = React.useState(initialData.careerStage || "");
  const [challenge, setChallenge] = React.useState(initialData.challenge || "");
  const [monthlyGoal, setMonthlyGoal] = React.useState(initialData.monthlyGoal || "");

  // Validation Error State
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Clear validation error when user alters inputs
  const handleNameChange = (val: string) => {
    setName(val);
    if (validationError) setValidationError(null);
    if (networkError) setNetworkError(null);
  };

  const handleCareerStageSelect = (val: string) => {
    setCareerStage(val);
    if (validationError) setValidationError(null);
    if (networkError) setNetworkError(null);
  };

  const handleChallengeSelect = (val: string) => {
    setChallenge(val);
    if (validationError) setValidationError(null);
    if (networkError) setNetworkError(null);
  };

  const handleMonthlyGoalChange = (val: string) => {
    setMonthlyGoal(val);
    if (validationError) setValidationError(null);
    if (networkError) setNetworkError(null);
  };

  // Keyboard shortcut listener for Enter key navigation
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement;
        // If user is inside a textarea, require Cmd/Ctrl+Enter instead to allow linebreaks
        if (target.tagName === "TEXTAREA") {
          return;
        }

        if (currentStep >= 1 && currentStep <= 4 && !isSubmitting) {
          e.preventDefault();
          handleContinue();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  });

  // Step 1 Submission
  const handleStep1Submit = async () => {
    const validation = step1NameSchema.safeParse({ name });
    if (!validation.success) {
      setValidationError(validation.error.errors[0]?.message || "Please enter your name");
      return;
    }

    setIsSubmitting(true);
    setNetworkError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 1,
          name: validation.data.name,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to save your name");
      }

      setName(validation.data.name);
      setCurrentStep(2);
    } catch (err) {
      setNetworkError(err instanceof Error ? err.message : "Connection failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Submission
  const handleStep2Submit = async () => {
    const validation = step2CareerStageSchema.safeParse({ careerStage });
    if (!validation.success) {
      setValidationError(validation.error.errors[0]?.message || "Please select your career stage");
      return;
    }

    setIsSubmitting(true);
    setNetworkError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 2,
          careerStage: validation.data.careerStage,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to save career stage");
      }

      setCurrentStep(3);
    } catch (err) {
      setNetworkError(err instanceof Error ? err.message : "Connection failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3 Submission
  const handleStep3Submit = async () => {
    const validation = step3ChallengeSchema.safeParse({ challenge });
    if (!validation.success) {
      setValidationError(validation.error.errors[0]?.message || "Please select your primary challenge");
      return;
    }

    setIsSubmitting(true);
    setNetworkError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 3,
          challenge: validation.data.challenge,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to save challenge");
      }

      setCurrentStep(4);
    } catch (err) {
      setNetworkError(err instanceof Error ? err.message : "Connection failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4 Submission (Final)
  const handleStep4Submit = async () => {
    const validation = step4MonthlyGoalSchema.safeParse({ monthlyGoal });
    if (!validation.success) {
      setValidationError(validation.error.errors[0]?.message || "Please describe your monthly goal");
      return;
    }

    setIsSubmitting(true);
    setNetworkError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 4,
          monthlyGoal: validation.data.monthlyGoal,
          isComplete: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to complete onboarding");
      }

      setMonthlyGoal(validation.data.monthlyGoal);
      setCurrentStep(5); // Show Confirmation Summary
    } catch (err) {
      setNetworkError(err instanceof Error ? err.message : "Connection failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (currentStep === 1) handleStep1Submit();
    else if (currentStep === 2) handleStep2Submit();
    else if (currentStep === 3) handleStep3Submit();
    else if (currentStep === 4) handleStep4Submit();
  };

  const handleBack = () => {
    if (currentStep > 1 && !isSubmitting) {
      setValidationError(null);
      setNetworkError(null);
      setCurrentStep((prev) => prev - 1);
    }
  };

  // If completed, show confirmation summary card
  if (currentStep === 5) {
    return (
      <OnboardingShell userEmail={initialData.userEmail}>
        <ConfirmationSummary
          name={name}
          careerStage={careerStage}
          challenge={challenge}
          monthlyGoal={monthlyGoal}
          onEditStep={(step) => {
            setCurrentStep(step);
          }}
        />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell userEmail={initialData.userEmail}>
      <Card className="bg-panel border-border shadow-2xl">
        <CardHeader className="pb-4">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={4}
            title={
              currentStep === 1
                ? "What should your AI Coach call you?"
                : currentStep === 2
                ? "What is your current career stage?"
                : currentStep === 3
                ? "What is your biggest confidence challenge right now?"
                : "What is your main goal for this month?"
            }
            subtitle={
              currentStep === 1
                ? "Enter your name to personalize your cognitive framework and daily check-ins."
                : currentStep === 2
                ? "Select your current trajectory so coaching scenarios and expectations match your level."
                : currentStep === 3
                ? "Choose the primary domain where self-doubt or high stakes impact you most."
                : "Set an ambitious, concrete 30-day objective to anchor your coaching sessions."
            }
          />
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Inline Network Error Alert */}
          {networkError && (
            <ErrorState
              message={networkError}
              onRetry={handleContinue}
              className="mb-2"
            />
          )}

          {/* STEP 1: Name */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="onboarding-name-input"
                  className="block text-[13.5px] font-medium text-text-primary"
                >
                  Full Name / Preferred Name
                </label>
                <Input
                  id="onboarding-name-input"
                  autoFocus
                  placeholder="e.g. Alex Mercer"
                  value={name}
                  disabled={isSubmitting}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="h-11 text-[14px] bg-panel"
                  aria-describedby={validationError ? "name-error" : undefined}
                />
                {validationError && (
                  <p
                    id="name-error"
                    role="alert"
                    className="text-[12.5px] text-danger font-medium pt-1"
                  >
                    {validationError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Career Stage */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <ChoiceList
                options={CAREER_STAGE_OPTIONS}
                selectedValue={careerStage}
                onSelect={handleCareerStageSelect}
                disabled={isSubmitting}
              />
              {validationError && (
                <p role="alert" className="text-[12.5px] text-danger font-medium pt-1">
                  {validationError}
                </p>
              )}
            </div>
          )}

          {/* STEP 3: Biggest Challenge */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <ChoiceList
                options={CHALLENGE_OPTIONS}
                selectedValue={challenge}
                onSelect={handleChallengeSelect}
                disabled={isSubmitting}
              />
              {validationError && (
                <p role="alert" className="text-[12.5px] text-danger font-medium pt-1">
                  {validationError}
                </p>
              )}
            </div>
          )}

          {/* STEP 4: Monthly Goal */}
          {currentStep === 4 && (
            <div>
              <GoalInput
                value={monthlyGoal}
                onChange={handleMonthlyGoalChange}
                onSubmitShortcut={handleStep4Submit}
                error={validationError}
                disabled={isSubmitting}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2">
          <OnboardingFooter
            currentStep={currentStep}
            totalSteps={4}
            canGoBack={currentStep > 1}
            canContinue={
              currentStep === 1
                ? name.trim().length >= 2
                : currentStep === 2
                ? !!careerStage
                : currentStep === 3
                ? !!challenge
                : monthlyGoal.trim().length >= 5
            }
            isSubmitting={isSubmitting}
            onBack={handleBack}
            onContinue={handleContinue}
            continueLabel={currentStep === 4 ? "Complete Setup" : "Continue"}
            className="w-full"
          />
        </CardFooter>
      </Card>
    </OnboardingShell>
  );
}
