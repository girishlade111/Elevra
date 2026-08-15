import Link from "next/link";
import { Settings, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DenseRow } from "@/components/ui/dense-row";
import { ROUTES } from "@/config/routes";
import { requireAuth } from "@/lib/auth/require-auth";
import { getProfile } from "@/db/repositories/profile.repository";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireAuth({ requireOnboarding: true });
  const profile = await getProfile(user.id);

  const displayName = profile?.name || user.name || "Coach User";
  const careerStage = profile?.careerStage || "Calibrated Professional";
  const challenge = profile?.challenge || "Confidence & Negotiation";
  const monthlyGoal = profile?.monthlyGoal || "Strengthen executive presence and assertive communication";

  return (
    <div>
      <AppHeader
        title="Confidence Profile"
        description="Comprehensive summary of your calibration parameters, goals, and behavioral focus areas."
        actions={
          <Link href={ROUTES.app.settings.profile}>
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              <span>Edit Settings</span>
            </Button>
          </Link>
        }
      />

      <div className="py-8">
        <Container size="default" className="space-y-6">
          <Card className="bg-panel border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[15px]">Active Calibration Profile</CardTitle>
              <Badge variant="accent" className="flex items-center gap-1 text-[11px]">
                <Sparkles className="h-3 w-3" />
                <span>Calibrated</span>
              </Badge>
            </CardHeader>
            <div>
              <DenseRow
                label="Full Name"
                description={displayName}
              />
              <DenseRow
                label="Career Stage"
                description={careerStage}
              />
              <DenseRow
                label="Primary Challenge"
                description={challenge}
                action={<Badge variant="secondary">Active Focus</Badge>}
              />
              <DenseRow
                label="Monthly Target Goal"
                description={monthlyGoal}
              />
              <DenseRow
                label="Onboarding Status"
                description={profile?.onboardingCompleted ? "Completed • All 4 steps calibrated" : "In Progress"}
                action={<Badge variant="success">Verified</Badge>}
              />
            </div>
          </Card>
        </Container>
      </div>
    </div>
  );
}
