import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <AppLayout
      userEmail={user.email || undefined}
      userName={user.name || undefined}
    >
      {children}
    </AppLayout>
  );
}
