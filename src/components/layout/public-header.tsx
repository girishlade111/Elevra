import * as React from "react";
import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="h-14 border-b border-border bg-panel px-6 sm:px-8 md:px-12 flex items-center justify-between sticky top-0 z-30">
      <Link href={ROUTES.public.home} className="flex items-center gap-2 font-semibold text-[14px] text-text-primary">
        <div className="h-2.5 w-2.5 rounded-full bg-accent" />
        <span>AI Confidence Coach</span>
      </Link>

      <nav className="hidden md:flex items-center gap-6 text-[13px] text-text-secondary">
        <Link href={ROUTES.public.features} className="hover:text-text-primary transition-colors">
          Features
        </Link>
        <Link href={ROUTES.public.howItWorks} className="hover:text-text-primary transition-colors">
          How It Works
        </Link>
        <Link href={ROUTES.public.pricing} className="hover:text-text-primary transition-colors">
          Pricing
        </Link>
        <Link href={ROUTES.public.about} className="hover:text-text-primary transition-colors">
          About
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <Link href={ROUTES.auth.signIn}>
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href={ROUTES.auth.signUp}>
          <Button variant="default" size="sm">
            Get Started
          </Button>
        </Link>
      </div>
    </header>
  );
}
