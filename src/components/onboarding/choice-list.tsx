"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChoiceOption {
  id?: string;
  value: string;
  label: string;
  description?: string;
}

interface ChoiceListProps {
  options: readonly ChoiceOption[] | ChoiceOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ChoiceList({
  options,
  selectedValue,
  onSelect,
  disabled = false,
  className,
}: ChoiceListProps) {
  // Keyboard shortcut listener for numeric keys 1-9
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        disabled
      ) {
        return;
      }

      const keyNumber = parseInt(e.key, 10);
      if (!isNaN(keyNumber) && keyNumber >= 1 && keyNumber <= options.length) {
        const option = options[keyNumber - 1];
        if (option) {
          e.preventDefault();
          onSelect(option.value);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, onSelect, disabled]);

  return (
    <div
      role="radiogroup"
      aria-label="Select an option"
      className={cn("space-y-2.5", className)}
    >
      {options.map((option, index) => {
        const isSelected = selectedValue === option.value;
        const shortcutNumber = index + 1;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onSelect(option.value)}
            className={cn(
              "w-full p-3.5 sm:p-4 rounded-[6px] border text-left transition-all duration-150 flex items-center justify-between group relative select-none",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isSelected
                ? "border-accent bg-accent/10 text-text-primary ring-1 ring-accent/30 shadow-[0_0_15px_rgba(224,120,86,0.08)]"
                : "border-border bg-panel text-text-secondary hover:border-text-muted/60 hover:bg-surface-hover hover:text-text-primary",
              disabled && "opacity-60 cursor-not-allowed pointer-events-none"
            )}
          >
            <div className="flex items-center gap-3.5 sm:gap-4 pr-3 min-w-0">
              {/* Numeric Shortcut Indicator Badge */}
              <div
                className={cn(
                  "h-6 w-6 rounded-[4px] border flex items-center justify-center text-[11px] font-mono font-medium shrink-0 transition-colors",
                  isSelected
                    ? "border-accent/40 bg-accent text-accent-foreground font-semibold"
                    : "border-border bg-surface-secondary text-text-muted group-hover:text-text-secondary group-hover:border-text-muted/40"
                )}
                aria-hidden="true"
              >
                {shortcutNumber}
              </div>

              {/* Text Content */}
              <div className="min-w-0 space-y-0.5">
                <div
                  className={cn(
                    "text-[14px] font-medium leading-snug truncate",
                    isSelected ? "text-text-primary font-semibold" : "text-text-primary"
                  )}
                >
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-[12px] text-text-secondary line-clamp-1 sm:line-clamp-2">
                    {option.description}
                  </div>
                )}
              </div>
            </div>

            {/* Selection Checkmark */}
            <div
              className={cn(
                "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                isSelected
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-transparent opacity-0 group-hover:opacity-40"
              )}
            >
              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
