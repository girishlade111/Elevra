import { requireAuth } from "@/lib/auth/require-auth";
import { getEmailConnection } from "@/db/repositories/email-connection.repository";
import { getEmailPreference } from "@/db/repositories/email-preference.repository";
import { EmailSettingsView } from "@/components/settings/email-settings-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Email Settings | Elevra",
  description: "Configure Resend or Gmail SMTP email delivery architecture for automated weekly check-ins.",
};

export default async function EmailSettingsPage() {
  const user = await requireAuth({ requireOnboarding: true });

  const [connection, preference] = await Promise.all([
    getEmailConnection(user.id),
    getEmailPreference(user.id),
  ]);

  const initialConnection = connection
    ? {
        email: connection.email,
        isConnected: connection.isConnected,
        lastTestedAt: connection.lastTestedAt ? connection.lastTestedAt.toISOString() : null,
      }
    : null;

  const initialPreferences = preference
    ? {
        provider: (preference.provider === "gmail" ? "gmail" : "resend") as "resend" | "gmail",
        weeklyCheckinsEnabled: preference.weeklyCheckinsEnabled ?? true,
        destinationEmail: preference.destinationEmail || user.email,
      }
    : {
        provider: "resend" as const,
        weeklyCheckinsEnabled: true,
        destinationEmail: user.email,
      };

  return (
    <div className="space-y-6">
      <EmailSettingsView
        initialConnection={initialConnection}
        initialPreferences={initialPreferences}
        userEmail={user.email}
      />
    </div>
  );
}
