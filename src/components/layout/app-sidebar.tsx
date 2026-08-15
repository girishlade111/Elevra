"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  History,
  TrendingUp,
  Mail,
  User,
  Settings,
  Sparkles,
  Home,
  Menu,
  X,
} from "lucide-react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

interface AppSidebarProps {
  userEmail?: string;
  userName?: string;
}

export function AppSidebar({ userEmail, userName }: AppSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navigationSections = [
    {
      title: "Workspace",
      items: [
        { title: "Overview", href: ROUTES.app.dashboard, icon: Home },
        { title: "AI Coach", href: ROUTES.app.coach, icon: MessageSquare },
        { title: "History", href: ROUTES.app.coachHistory, icon: History },
      ],
    },
    {
      title: "Growth & Insights",
      items: [
        { title: "Progress & Metrics", href: ROUTES.app.progress, icon: TrendingUp },
        { title: "Weekly Check-ins", href: ROUTES.app.checkIns, icon: Mail },
        { title: "Confidence Profile", href: ROUTES.app.profile, icon: User },
      ],
    },
    {
      title: "Configuration",
      items: [
        { title: "Settings", href: ROUTES.app.settings.root, icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-panel text-text-primary sticky top-0 z-40">
        <div className="flex items-center gap-2 font-semibold text-[14px]">
          <div className="h-2 w-2 rounded-full bg-accent" />
          <span>Confidence Coach</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-[4px] text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Fixed Desktop ~260px / Sliding Drawer Mobile) */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-panel border-r border-border flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div>
          <div className="h-14 px-5 flex items-center justify-between border-b border-border">
            <Link
              href={ROUTES.app.dashboard}
              className="flex items-center gap-2.5 font-semibold text-[14px] text-text-primary hover:text-text-primary"
              onClick={() => setMobileOpen(false)}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span>Confidence Coach</span>
            </Link>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-success border border-success/30 bg-success/10 px-1.5 py-0.5 rounded-[3px]">
              <Sparkles className="h-3 w-3" />
              <span>NIM Active</span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="p-3 space-y-6 overflow-y-auto">
            {navigationSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-2.5 py-1 text-[11px] font-medium text-text-muted uppercase tracking-wider">
                  {section.title}
                </div>
                <nav className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === ROUTES.app.dashboard
                        ? pathname === ROUTES.app.dashboard
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-[13px] font-normal transition-colors select-none",
                          isActive
                            ? "bg-surface-secondary text-text-primary font-medium border border-border"
                            : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-accent" : "text-text-secondary")} />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Authenticated User Menu Footer */}
        <div className="p-3 border-t border-border bg-panel">
          <UserMenu userEmail={userEmail} userName={userName} />
        </div>
      </aside>
    </>
  );
}
