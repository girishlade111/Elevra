import * as React from "react";
import Link from "next/link";
import { ROUTES } from "@/config/routes";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-panel py-10 px-6 sm:px-8 md:px-12 text-text-secondary text-[12.5px]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent" />
          <span className="font-medium text-text-primary">AI Confidence Coach</span>
          <span className="text-text-muted">© {new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center gap-5">
          <Link href={ROUTES.public.privacy} className="hover:text-text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href={ROUTES.public.terms} className="hover:text-text-primary transition-colors">
            Terms of Service
          </Link>
          <Link href={ROUTES.public.about} className="hover:text-text-primary transition-colors">
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
