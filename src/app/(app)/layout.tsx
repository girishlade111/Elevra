import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { getAuthSession } from "@/lib/auth/session";

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  return (
    <AppLayout
      userEmail={session?.email ?? undefined}
      userName={session?.name ?? undefined}
    >
      {children}
    </AppLayout>
  );
}
