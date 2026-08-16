"use client";

import * as React from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
  onBack?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "A temporary disruption occurred while loading this view. Please try again.",
  code,
  onRetry,
  onBack,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`rounded-md border border-danger/30 bg-danger/5 p-6 sm:p-8 text-center space-y-4 max-w-lg mx-auto ${className}`}
    >
      <div className="h-10 w-10 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center mx-auto text-danger">
        <AlertCircle className="h-5 w-5" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
          {code && (
            <Badge variant="outline" className="text-[10px] font-mono border-danger/30 text-danger bg-danger/10">
              {code}
            </Badge>
          )}
        </div>
        <p className="text-[12.5px] text-text-secondary leading-relaxed max-w-md mx-auto">
          {message}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2.5 pt-2">
        {onBack && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onBack}
            className="h-8 text-[12px] gap-1.5 bg-surface-secondary border-border hover:bg-surface-hover"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go Back</span>
          </Button>
        )}

        {onRetry && (
          <Button
            type="button"
            size="sm"
            onClick={onRetry}
            className="h-8 text-[12px] gap-1.5 bg-accent hover:bg-accent-hover text-accent-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>
        )}
      </div>
    </div>
  );
}
