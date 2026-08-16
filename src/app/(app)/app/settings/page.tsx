import { requireAuth } from "@/lib/auth/require-auth";
import { getProfile } from "@/db/repositories/profile.repository";
import { getEmailPreference } from "@/db/repositories/email-preference.repository";
import { getEmailConnection } from "@/db/repositories/email-connection.repository";
import { SettingsHubView } from "@/components/settings/settings-hub-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings | Elevra",
  description: "Manage your profile, career objectives, email delivery preferences, and privacy controls.",
};

export default async function SettingsPage() {
  const user = await requireAuth({ requireOnboarding: true });

  const [profile, emailPref, emailConn] = await Promise.all([
    getProfile(user.id),
    getEmailPreference(user.id),
    getEmailConnection(user.id),
  ]);

  const userName = profile?.name || user.firstName || user.name || "Client";
  const userEmail = profile?.email || user.email || "";
  const careerStage = profile?.careerStage || "Professional";
  const challenge = profile?.challenge || "General confidence & assertive communication";

  const emailProvider = emailPref?.provider || (emailConn?.isConnected ? "gmail" : "resend");
  const weeklyCheckinsEnabled = emailPref?.weeklyCheckinsEnabled ?? true;
  const hasGmailConnected = Boolean(emailConn?.isConnected);

  return (
    <div className="space-y-6">
      <SettingsHubView
        userName={userName}
        userEmail={userEmail}
        careerStage={careerStage}
        challenge={challenge}
        emailProvider={emailProvider}
        weeklyCheckinsEnabled={weeklyCheckinsEnabled}
        hasGmailConnected={hasGmailConnected}
      />
    </div>
  );
}
