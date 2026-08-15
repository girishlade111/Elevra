"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Connection Error",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "p-4 rounded-[6px] border border-danger/40 bg-danger/10 text-text-primary space-y-3",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <div className="text-[13.5px] font-medium text-danger">{title}</div>
          <div className="text-[12.5px] text-text-secondary leading-relaxed">
            {message}
          </div>
        </div>
      </div>

      {onRetry && (
        <div className="pl-8 pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-1.5 text-[12px] h-7 px-2.5"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry Action</span>
          </Button>
        </div>
      )}
    </div>
  );
}
