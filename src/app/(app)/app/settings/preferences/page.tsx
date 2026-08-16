import { requireAuth } from "@/lib/auth/require-auth";
import { getEmailPreference } from "@/db/repositories/email-preference.repository";
import { PreferencesView } from "@/components/settings/preferences-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Preferences | Elevra",
  description: "Configure your coaching tone, delivery schedule, and cognitive behavioral settings.",
};

export default async function PreferencesPage() {
  const user = await requireAuth({ requireOnboarding: true });
  const emailPref = await getEmailPreference(user.id);

  const initialWeeklyEnabled = emailPref?.weeklyCheckinsEnabled ?? true;
  const initialProvider = (emailPref?.provider === "gmail" ? "gmail" : "resend") as "resend" | "gmail";
  const initialDestinationEmail = emailPref?.destinationEmail || user.email;

  return (
    <div className="space-y-6">
      <PreferencesView
        initialWeeklyEnabled={initialWeeklyEnabled}
        initialProvider={initialProvider}
        initialDestinationEmail={initialDestinationEmail}
      />
    </div>
  );
}
