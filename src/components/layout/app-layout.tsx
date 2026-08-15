import * as React from "react";
import { AppSidebar } from "./app-sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  userEmail?: string;
  userName?: string;
}

export function AppLayout({ children, userEmail, userName }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col lg:flex-row">
      <AppSidebar userEmail={userEmail} userName={userName} />
      <div className="flex-1 lg:pl-[260px] flex flex-col min-h-screen">
        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
