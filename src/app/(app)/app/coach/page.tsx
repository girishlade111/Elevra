import { requireAuth } from "@/lib/auth/require-auth";
import { CoachChatView } from "@/components/coach/coach-chat-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Live Coaching | Elevra",
  description: "Personalized, evidence-based cognitive behavioral coaching powered by NVIDIA NIM.",
};

export default async function CoachPage() {
  // Ensure user is authenticated and has finished onboarding
  await requireAuth({ requireOnboarding: true });

  return <CoachChatView />;
}
