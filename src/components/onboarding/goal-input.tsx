"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmitShortcut?: () => void;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

const INSPIRATION_GOALS = [
  "Negotiate a 15% compensation increase during review",
  "Confidently present architecture vision to executives",
  "Ace my final-round behavioral interviews without freezing",
  "Establish firm 6 PM work-life boundaries without guilt",
  "Transition into a Product Management leadership role",
  "Build active outreach habits with 5 industry mentors",
];

export function GoalInput({
  value,
  onChange,
  onSubmitShortcut,
  error,
  disabled = false,
  className,
}: GoalInputProps) {
  const minLength = 5;
  const maxLength = 500;
  const currentLength = value.trim().length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (onSubmitShortcut && currentLength >= minLength && !disabled) {
        onSubmitShortcut();
      }
    }
  };

  const handleSelectInspiration = (inspiration: string) => {
    if (disabled) return;
    onChange(inspiration);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1.5">
        <label
          htmlFor="monthly-goal-input"
          className="block text-[13.5px] font-medium text-text-primary"
        >
          Your Objective for the Next 30 Days
        </label>
        <div className="relative">
          <textarea
            id="monthly-goal-input"
            rows={4}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. I want to secure a promotion to Senior Engineer and negotiate a 15% compensation increase during the upcoming performance cycle..."
            maxLength={maxLength}
            className={cn(
              "w-full px-3.5 py-3 rounded-[6px] border bg-panel text-[13.5px] text-text-primary placeholder:text-text-muted resize-none leading-relaxed transition-all",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
              error
                ? "border-danger focus:ring-danger"
                : "border-border hover:border-text-muted/60",
              disabled && "opacity-60 cursor-not-allowed"
            )}
            aria-describedby="goal-char-count goal-error"
          />
        </div>

        {/* Counter and Shortcut Hint */}
        <div className="flex items-center justify-between text-[11.5px] text-text-muted pt-1">
          <div>
            {currentLength < minLength ? (
              <span className="text-text-muted">
                Minimum {minLength} characters ({minLength - currentLength} more needed)
              </span>
            ) : (
              <span className="text-success flex items-center gap-1">
                ✓ Goal meets calibration threshold
              </span>
            )}
          </div>
          <div id="goal-char-count" className="font-mono">
            {currentLength} / {maxLength}
          </div>
        </div>

        {/* Inline Error Message */}
        {error && (
          <p id="goal-error" role="alert" className="text-[12.5px] text-danger font-medium pt-1">
            {error}
          </p>
        )}
      </div>

      {/* Quick Inspiration Chips */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-text-secondary">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>Quick Inspiration Prompts (Click to populate)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {INSPIRATION_GOALS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectInspiration(prompt)}
              className={cn(
                "px-2.5 py-1.5 rounded-[4px] border border-border bg-surface-secondary text-[12px] text-text-secondary text-left transition-colors",
                "hover:border-accent/40 hover:bg-surface-hover hover:text-text-primary",
                "focus:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                value === prompt && "border-accent bg-accent/10 text-accent font-medium"
              )}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
