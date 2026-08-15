import * as React from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Container } from "@/components/layout/container";
import { SettingsNav } from "@/components/layout/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <AppHeader
        title="Settings & Workspace Preferences"
        description="Manage account details, email provider connections, and coaching configurations."
      />

      <div className="py-8">
        <Container size="default">
          <SettingsNav />
          {children}
        </Container>
      </div>
    </div>
  );
}
