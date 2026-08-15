import * as React from "react";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
