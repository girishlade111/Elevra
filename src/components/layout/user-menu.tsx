"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, Settings, User as UserIcon, ChevronUp, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  userEmail?: string;
  userName?: string;
  className?: string;
}

export function UserMenu({ userEmail, userName, className }: UserMenuProps) {
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const displayName =
    userName ||
    (clerkUser?.firstName
      ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
      : "Coach User");

  const displayEmail =
    userEmail ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses[0]?.emailAddress ||
    "user@workspace.app";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U";

  // Close menu on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push(ROUTES.public.home);
    } catch (error) {
      console.error("Sign out error:", error);
      window.location.href = "/";
    }
  };

  return (
    <div ref={menuRef} className={cn("relative w-full", className)}>
      {/* Dropdown Menu Popup */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-panel border border-border rounded-[4px] py-1 z-50">
          <div className="px-3 py-2 border-b border-border">
            <div className="text-[12px] font-medium text-text-primary truncate">
              {displayName}
            </div>
            <div className="text-[11px] text-text-muted truncate">
              {displayEmail}
            </div>
          </div>

          <div className="py-1">
            <Link
              href={ROUTES.app.profile}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Confidence Profile</span>
            </Link>

            <Link
              href={ROUTES.app.settings.root}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Workspace Settings</span>
            </Link>
          </div>

          <div className="border-t border-border pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-[12.5px] text-danger hover:bg-surface-hover transition-colors text-left"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-2.5 py-2 rounded-[4px] bg-surface-secondary/70 hover:bg-surface-hover border border-border flex items-center justify-between transition-colors text-left group"
        aria-expanded={open}
        aria-label="User profile options"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-[4px] bg-surface-secondary border border-border flex items-center justify-center text-[11px] font-semibold text-text-primary shrink-0">
            {clerkUser?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clerkUser.imageUrl}
                alt={displayName}
                className="h-full w-full rounded-[4px] object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 overflow-hidden pr-1">
            <div className="text-[12px] font-medium text-text-primary truncate">
              {displayName}
            </div>
            <div className="text-[11px] text-text-muted truncate flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-success shrink-0" />
              <span>Verified</span>
            </div>
          </div>
        </div>
        <ChevronUp
          className={cn(
            "h-3.5 w-3.5 text-text-muted group-hover:text-text-secondary transition-transform shrink-0",
            open ? "transform rotate-180" : ""
          )}
        />
      </button>
    </div>
  );
}
