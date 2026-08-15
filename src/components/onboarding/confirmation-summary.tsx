"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles, ArrowRight, User, Briefcase, Target, Flag } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/config/routes";

interface ConfirmationSummaryProps {
  name: string;
  careerStage: string;
  challenge: string;
  monthlyGoal: string;
  onEditStep?: (step: number) => void;
}

export function ConfirmationSummary({
  name,
  careerStage,
  challenge,
  monthlyGoal,
  onEditStep,
}: ConfirmationSummaryProps) {
  const router = useRouter();
  const [countdown, setCountdown] = React.useState(5);
  const [isNavigating, setIsNavigating] = React.useState(false);

  // Auto-redirect after brief review period
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsNavigating(true);
          router.push(ROUTES.app.dashboard);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleLaunchNow = () => {
    setIsNavigating(true);
    router.push(ROUTES.app.dashboard);
  };

  return (
    <Card className="bg-panel border-border shadow-2xl overflow-hidden">
      {/* Top Banner */}
      <div className="bg-success/10 border-b border-success/20 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-[13px] font-medium text-text-primary">
            Calibration Profile Complete
          </span>
        </div>
        <Badge variant="success" className="text-[11px]">
          Ready
        </Badge>
      </div>

      <CardHeader className="pt-6 pb-2 space-y-1.5">
        <div className="text-[12px] font-mono text-accent uppercase tracking-wider font-semibold">
          Summary & Next Steps
        </div>
        <h1 className="text-[22px] font-semibold text-text-primary">
          Your Cognitive Framework is Configured
        </h1>
        <p className="text-[13px] text-text-secondary">
          We&apos;ve calibrated your AI Confidence Coach around your career context and immediate objectives.
        </p>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        {/* Attribute 1: Name */}
        <div className="p-3.5 rounded-[6px] border border-border bg-surface-secondary flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-1.5 rounded-[4px] bg-panel border border-border text-accent mt-0.5">
              <User className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
                Name
              </div>
              <div className="text-[14px] font-semibold text-text-primary mt-0.5">
                {name || "Coach User"}
              </div>
            </div>
          </div>
          {onEditStep && (
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="text-[11.5px] text-text-muted hover:text-accent underline underline-offset-2 transition-colors shrink-0"
            >
              Edit
            </button>
          )}
        </div>

        {/* Attribute 2: Career Stage */}
        <div className="p-3.5 rounded-[6px] border border-border bg-surface-secondary flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-1.5 rounded-[4px] bg-panel border border-border text-accent mt-0.5">
              <Briefcase className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
                Career Stage
              </div>
              <div className="text-[14px] font-semibold text-text-primary mt-0.5">
                {careerStage}
              </div>
            </div>
          </div>
          {onEditStep && (
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-[11.5px] text-text-muted hover:text-accent underline underline-offset-2 transition-colors shrink-0"
            >
              Edit
            </button>
          )}
        </div>

        {/* Attribute 3: Primary Challenge */}
        <div className="p-3.5 rounded-[6px] border border-border bg-surface-secondary flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-1.5 rounded-[4px] bg-panel border border-border text-accent mt-0.5">
              <Target className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
                Primary Challenge
              </div>
              <div className="text-[14px] font-semibold text-text-primary mt-0.5">
                {challenge}
              </div>
            </div>
          </div>
          {onEditStep && (
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="text-[11.5px] text-text-muted hover:text-accent underline underline-offset-2 transition-colors shrink-0"
            >
              Edit
            </button>
          )}
        </div>

        {/* Attribute 4: Monthly Goal */}
        <div className="p-3.5 rounded-[6px] border border-border bg-surface-secondary flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-1.5 rounded-[4px] bg-panel border border-border text-accent mt-0.5">
              <Flag className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
                Monthly Goal
              </div>
              <div className="text-[13.5px] font-medium text-text-primary mt-0.5 leading-relaxed">
                {monthlyGoal}
              </div>
            </div>
          </div>
          {onEditStep && (
            <button
              type="button"
              onClick={() => onEditStep(4)}
              className="text-[11.5px] text-text-muted hover:text-accent underline underline-offset-2 transition-colors shrink-0"
            >
              Edit
            </button>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[12px] text-text-muted">
          Auto-entering workspace in <span className="font-mono font-semibold text-accent">{countdown}s</span>...
        </div>

        <Button
          size="default"
          onClick={handleLaunchNow}
          disabled={isNavigating}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-accent-foreground font-semibold px-6 shadow-[0_0_20px_rgba(224,120,86,0.2)]"
        >
          <span>Launch AI Coach</span>
          {isNavigating ? (
            <Sparkles className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
