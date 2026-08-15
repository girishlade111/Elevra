"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

export function SettingsNav() {
  const pathname = usePathname();

  const tabs = [
    { label: "General", href: ROUTES.app.settings.root },
    { label: "Confidence Profile", href: ROUTES.app.settings.profile },
    { label: "Email Integration", href: ROUTES.app.settings.email },
    { label: "Preferences", href: ROUTES.app.settings.preferences },
  ];

  return (
    <nav className="flex items-center gap-1 border-b border-border pb-px mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive =
          tab.href === ROUTES.app.settings.root
            ? pathname === ROUTES.app.settings.root
            : pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3.5 py-2 text-[13px] font-medium border-b-2 -mb-[1px] transition-colors whitespace-nowrap",
              isActive
                ? "border-accent text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
