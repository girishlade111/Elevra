"use client";

import * as React from "react";
import { Check, Copy, Sparkles, Target, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AICoachingResponse } from "@/lib/ai/schemas";

interface AssistantMessageCardProps {
  content: string;
  structured?: AICoachingResponse | null;
  intent?: string | null;
  timestamp: string;
}

export function AssistantMessageCard({
  content,
  structured,
  intent,
  timestamp,
}: AssistantMessageCardProps) {
  const [copied, setCopied] = React.useState(false);

  // Attempt to parse JSON if structured is not pre-parsed
  const parsedData = React.useMemo<AICoachingResponse | null>(() => {
    if (structured && typeof structured === "object" && structured.main_advice) {
      return structured;
    }
    try {
      const parsed = JSON.parse(content);
      if (parsed && (parsed.main_advice || parsed.coachingMessage)) {
        return {
          main_advice: parsed.main_advice || parsed.coachingMessage,
          actionable_step:
            parsed.actionable_step ||
            parsed.recommendedMicroAction?.description ||
            parsed.recommendedMicroAction?.title ||
            "Take one minute to breathe and write down your primary objective.",
          follow_up_question:
            parsed.follow_up_question ||
            parsed.followUpPrompt ||
            "What feels like the most challenging aspect of this for you right now?",
          intent_detected: parsed.intent_detected || parsed.intent || (intent as any) || "general",
        };
      }
    } catch {
      // Content is raw text
    }
    return null;
  }, [content, structured, intent]);

  const displayedIntent = parsedData?.intent_detected || intent || "general";

  const handleCopy = async () => {
    const textToCopy = parsedData
      ? `ADVICE:\n${parsedData.main_advice}\n\nTODAY'S ACTION:\n${parsedData.actionable_step}\n\nREFLECTION:\n${parsedData.follow_up_question}`
      : content;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <div className="w-full rounded-md border border-border bg-panel text-[13.5px] leading-relaxed text-text-primary">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-2.5 bg-surface-secondary/40 text-[12px]">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium text-text-primary">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Elevra Coach</span>
          </div>
          {displayedIntent && (
            <Badge
              variant="outline"
              className="text-[11px] font-normal border-border bg-surface-secondary text-text-secondary capitalize"
            >
              {displayedIntent.replace(/_/g, " ")}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-text-muted text-[11.5px]">
          <span>{timestamp}</span>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy advice to clipboard"
            aria-label="Copy advice to clipboard"
            className="p-1 rounded hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Structured Content or Raw Fallback */}
      <div className="p-4 space-y-4">
        {parsedData ? (
          <>
            {/* 1. Main Advice */}
            <div className="space-y-1.5">
              <div className="text-[11.5px] font-medium uppercase tracking-wider text-text-muted">
                Coaching Perspective
              </div>
              <div className="text-text-primary leading-relaxed whitespace-pre-wrap">
                {parsedData.main_advice}
              </div>
            </div>

            {/* 2. Today's Action */}
            <div className="rounded-sm border border-border bg-surface-secondary/70 p-3.5 border-l-2 border-l-accent space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-accent uppercase tracking-wider">
                  <Target className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span>Today&apos;s Action</span>
                </div>
                <span className="text-[11px] text-text-muted font-normal">Micro-Experiment</span>
              </div>
              <div className="text-[13px] text-text-primary font-medium leading-snug">
                {parsedData.actionable_step}
              </div>
            </div>

            {/* 3. Follow-up Question */}
            <div className="rounded-sm border border-border/80 bg-surface-secondary/40 p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-text-secondary uppercase tracking-wider">
                <HelpCircle className="h-3.5 w-3.5 text-text-muted shrink-0" />
                <span>Reflection Question</span>
              </div>
              <div className="text-[13px] text-text-secondary italic leading-relaxed">
                &ldquo;{parsedData.follow_up_question}&rdquo;
              </div>
            </div>
          </>
        ) : (
          <div className="whitespace-pre-wrap text-text-primary">{content}</div>
        )}
      </div>
    </div>
  );
}
