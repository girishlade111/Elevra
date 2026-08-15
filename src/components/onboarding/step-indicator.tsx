"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  className?: string;
}

export function StepIndicator({
  currentStep,
  totalSteps = 4,
  title,
  subtitle,
  className,
}: StepIndicatorProps) {
  const formattedCurrent = String(currentStep).padStart(2, "0");
  const formattedTotal = String(totalSteps).padStart(2, "0");
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentStep / totalSteps) * 100)
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Step Counter & Category Metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-[12px] font-mono font-semibold text-accent tracking-wider"
            aria-label={`Step ${currentStep} of ${totalSteps}`}
          >
            {formattedCurrent} / {formattedTotal}
          </span>
          <div className="h-1 w-1 rounded-full bg-border" />
          <span className="text-[12px] font-medium text-text-secondary uppercase tracking-wider">
            {currentStep === 1 && "Identity"}
            {currentStep === 2 && "Career Stage"}
            {currentStep === 3 && "Primary Focus"}
            {currentStep === 4 && "Monthly Target"}
          </span>
        </div>

        <div className="text-[12px] text-text-muted">
          {Math.round(progressPercent)}% completed
        </div>
      </div>

      {/* Slim 2px Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step progress: ${currentStep} of ${totalSteps}`}
        className="w-full h-[2px] bg-surface-secondary rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Focused Step Heading */}
      <div className="pt-2 space-y-1.5">
        <h1 className="text-[20px] sm:text-[22px] font-semibold text-text-primary tracking-tight leading-snug">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13.5px] text-text-secondary leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
