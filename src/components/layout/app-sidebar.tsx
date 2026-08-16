"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  TrendingUp,
  Mail,
  User,
  Settings,
  Sparkles,
  LayoutDashboard,
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

  // Close mobile drawer on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const navigationItems = [
    { title: "Overview", href: ROUTES.app.dashboard, icon: LayoutDashboard, exact: true },
    { title: "Coach", href: ROUTES.app.coach, icon: MessageSquare, exact: false },
    { title: "Progress", href: ROUTES.app.progress, icon: TrendingUp, exact: false },
    { title: "Check-ins", href: ROUTES.app.checkIns, icon: Mail, exact: false },
    { title: "Profile", href: ROUTES.app.profile, icon: User, exact: false },
    { title: "Settings", href: ROUTES.app.settings.root, icon: Settings, exact: false },
  ];

  const isItemActive = (item: (typeof navigationItems)[number]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-panel text-text-primary sticky top-0 z-40">
        <Link href={ROUTES.app.dashboard} className="flex items-center gap-2 font-semibold text-[14px]">
          <div className="h-2 w-2 rounded-full bg-accent" />
          <span>Elevra</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-[4px] text-text-secondary hover:text-text-primary hover:bg-surface-secondary focus-visible:ring-1 focus-visible:ring-accent min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop Fixed / Mobile Drawer) */}
      <aside
        id="app-sidebar"
        aria-label="Application Sidebar"
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-panel border-r border-border flex flex-col justify-between transition-transform duration-150 ease-in-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header & Nav List */}
        <div>
          <div className="h-14 px-5 flex items-center justify-between border-b border-border">
            <Link
              href={ROUTES.app.dashboard}
              className="flex items-center gap-2.5 font-semibold text-[14px] text-text-primary hover:text-text-primary focus-visible:ring-1 focus-visible:ring-accent rounded p-1"
              onClick={() => setMobileOpen(false)}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span>Elevra</span>
            </Link>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-success border border-success/30 bg-success/10 px-1.5 py-0.5 rounded-[3px]">
              <Sparkles className="h-3 w-3" />
              <span>Active</span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="p-3 space-y-1 overflow-y-auto">
            <div className="px-2.5 py-1.5 text-[11px] font-medium text-text-muted uppercase tracking-wider">
              Navigation
            </div>
            <nav aria-label="Main Navigation" className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-[13px] font-normal transition-colors select-none focus-visible:ring-1 focus-visible:ring-accent",
                      active
                        ? "bg-surface-secondary text-text-primary font-medium border border-border border-l-2 border-l-accent"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active ? "text-accent" : "text-text-muted"
                      )}
                      aria-hidden="true"
                    />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Account Footer */}
        <div className="p-3 border-t border-border bg-panel">
          <UserMenu userEmail={userEmail} userName={userName} />
        </div>
      </aside>
    </>
  );
}
