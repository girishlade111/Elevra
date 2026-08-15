import { requireAuth } from "@/lib/auth/require-auth";
import { getProfile } from "@/db/repositories/profile.repository";
import { OnboardingFlow, type InitialOnboardingData } from "@/components/onboarding";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Onboarding & Calibration | Elevra",
  description: "Calibrate your AI Confidence Coach framework and 30-day growth targets.",
};

export default async function OnboardingPage() {
  // If user is already onboarded, redirect immediately to /app
  const user = await requireAuth({ redirectIfOnboarded: true });

  // Load existing profile from Neon DB to resume from where the user left off
  let profile = null;
  try {
    profile = await getProfile(user.id);
  } catch (error) {
    console.warn("Could not load profile from database in onboarding page:", error);
  }

  const initialData: InitialOnboardingData = {
    userEmail: user.email || undefined,
    name: profile?.name || user.name || "",
    careerStage: profile?.careerStage || "",
    challenge: profile?.challenge || "",
    monthlyGoal: profile?.monthlyGoal || "",
    onboardingStep: profile?.onboardingStep ?? 0,
    onboardingCompleted: profile?.onboardingCompleted ?? false,
  };

  return <OnboardingFlow initialData={initialData} />;
}
