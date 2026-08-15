import * as React from "react";
import { Sparkles } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

interface AppHeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AppHeader({ title, description, actions }: AppHeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-panel px-6 sm:px-8 md:px-10 lg:px-12 flex items-center justify-between sticky top-0 z-30">
      <div className="flex flex-col">
        {title && (
          <h1 className="text-[15px] font-semibold text-text-primary leading-tight">
            {title}
          </h1>
        )}
        {description && (
          <p className="text-[12px] text-text-secondary leading-tight mt-0.5">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] border border-border bg-surface-secondary text-[11.5px] text-text-secondary">
          <Sparkles className="h-3 w-3 text-accent" />
          <span>Meta Llama 3.1 70B</span>
        </div>
        <div className="pl-2 border-l border-border flex items-center">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: "h-7 w-7 rounded-[4px] border border-border",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
