"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingFooterProps {
  currentStep: number;
  totalSteps?: number;
  canGoBack?: boolean;
  canContinue?: boolean;
  isSubmitting?: boolean;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  className?: string;
}

export function OnboardingFooter({
  currentStep,
  totalSteps = 4,
  canGoBack = true,
  canContinue = true,
  isSubmitting = false,
  onBack,
  onContinue,
  continueLabel,
  className,
}: OnboardingFooterProps) {
  const isFinalStep = currentStep === totalSteps;

  const defaultContinueLabel = isFinalStep ? "Complete Calibration" : "Continue";
  const displayLabel = continueLabel || defaultContinueLabel;

  return (
    <div
      className={cn(
        "pt-6 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-between gap-3 select-none",
        className
      )}
    >
      {/* Back Button or Placeholder */}
      <div>
        {currentStep > 1 && canGoBack ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onBack}
            disabled={isSubmitting}
            className="w-full sm:w-auto flex items-center gap-1.5 text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </Button>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>

      {/* Continue / Submit and Keyboard Hint */}
      <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
        <span className="hidden sm:inline-block text-[11.5px] text-text-muted font-mono">
          Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-secondary text-text-secondary text-[10px]">Enter ↵</kbd>
        </span>

        <Button
          type="button"
          size="default"
          onClick={onContinue}
          disabled={!canContinue || isSubmitting}
          className={cn(
            "w-full sm:w-auto min-w-[140px] flex items-center justify-center gap-2 font-medium",
            isFinalStep
              ? "bg-accent hover:bg-accent-hover text-accent-foreground shadow-[0_0_20px_rgba(224,120,86,0.15)]"
              : ""
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-current" />
              <span>Saving...</span>
            </>
          ) : isFinalStep ? (
            <>
              <span>{displayLabel}</span>
              <Sparkles className="h-4 w-4" />
            </>
          ) : (
            <>
              <span>{displayLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
