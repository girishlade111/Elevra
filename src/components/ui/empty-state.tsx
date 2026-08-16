"use client";

import * as React from "react";
import { LucideIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-md border border-border bg-panel p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto ${className}`}
    >
      <div className="h-10 w-10 rounded-full bg-surface-secondary border border-border flex items-center justify-center mx-auto text-accent">
        <Icon className="h-5 w-5" />
      </div>

      <div className="space-y-1">
        <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
        <p className="text-[12.5px] text-text-muted leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <Button
            type="button"
            size="sm"
            onClick={onAction}
            className="h-8 text-[12px] bg-accent hover:bg-accent-hover text-accent-foreground"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
