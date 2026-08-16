import { requireAuth } from "@/lib/auth/require-auth";
import { getProfile } from "@/db/repositories/profile.repository";
import { ProfileForm } from "@/components/settings/profile-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile Settings | Elevra",
  description: "Update your career stage, behavioral challenges, and monthly confidence objectives.",
};

export default async function ProfileSettingsPage() {
  const user = await requireAuth({ requireOnboarding: true });
  const profile = await getProfile(user.id);

  const initialData = {
    name: profile?.name || user.firstName || user.name || "",
    email: profile?.email || user.email || "",
    careerStage: profile?.careerStage || "Mid-Level Professional",
    challenge: profile?.challenge || "",
    monthlyGoal: profile?.monthlyGoal || "",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <ProfileForm initialData={initialData} />
    </div>
  );
}
