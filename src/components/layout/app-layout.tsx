"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { ROUTES } from "@/config/routes";

interface AppLayoutProps {
  children: React.ReactNode;
  userEmail?: string;
  userName?: string;
}

export function AppLayout({ children, userEmail, userName }: AppLayoutProps) {
  const pathname = usePathname();
  const isOnboarding = pathname === ROUTES.app.onboarding || pathname.startsWith("/app/onboarding");

  // Onboarding has its own dedicated OnboardingShell layout without the workspace sidebar
  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex flex-col">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col lg:flex-row">
      <AppSidebar userEmail={userEmail} userName={userName} />
      <div className="flex-1 lg:pl-[260px] flex flex-col min-h-screen">
        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
