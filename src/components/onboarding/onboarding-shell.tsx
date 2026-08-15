"use client";

import * as React from "react";
import { UserButton } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingShellProps {
  children: React.ReactNode;
  userEmail?: string;
  className?: string;
}

export function OnboardingShell({
  children,
  userEmail,
  className,
}: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between selection:bg-accent/30 selection:text-text-primary">
      {/* Top Minimalist Header */}
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-border bg-panel/60 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[14px] font-semibold tracking-tight text-text-primary">
            Elevra
          </span>
          <span className="hidden sm:inline-block text-[12px] text-text-muted border-l border-border pl-2.5">
            Confidence Calibration
          </span>
        </div>

        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="hidden md:inline-block text-[12px] text-text-secondary">
              {userEmail}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-accent border border-accent/20 bg-accent/10 px-2 py-0.5 rounded-[3px]">
            <Sparkles className="h-3 w-3" />
            <span>Setup In Progress</span>
          </div>
          <div className="pl-1">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-7 w-7 rounded-[4px] border border-border",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Focus Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div
          className={cn(
            "w-full max-w-[620px] mx-auto transition-all duration-200",
            className
          )}
        >
          {children}
        </div>
      </main>

      {/* Subtle Bottom Footer */}
      <footer className="py-4 px-6 text-center border-t border-border/40 text-[11.5px] text-text-muted">
        <span>Quiet Cognitive Calibration • Protected by Clerk & Neon</span>
      </footer>
    </div>
  );
}
