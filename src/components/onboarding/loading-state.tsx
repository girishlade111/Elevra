"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading your calibration profile...",
  className,
}: LoadingStateProps) {
  return (
    <Card className={cn("bg-panel border-border shadow-xl", className)}>
      <CardHeader className="space-y-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 bg-surface-secondary rounded animate-pulse" />
          <div className="h-4 w-12 bg-surface-secondary rounded animate-pulse" />
        </div>
        <div className="w-full h-1 bg-surface-secondary rounded-full overflow-hidden" />
        <div className="space-y-2 pt-2">
          <div className="h-6 w-3/4 bg-surface-secondary rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-surface-secondary rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
        <Loader2 className="h-6 w-6 text-accent animate-spin" />
        <p className="text-[13px] text-text-secondary">{message}</p>
      </CardContent>
    </Card>
  );
}
