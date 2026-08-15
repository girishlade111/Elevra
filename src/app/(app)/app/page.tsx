import Link from "next/link";
import { MessageSquare, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DenseRow } from "@/components/ui/dense-row";
import { ROUTES } from "@/config/routes";
import { requireAuth } from "@/lib/auth/require-auth";

import { getProfile } from "@/db/repositories/profile.repository";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth({ requireOnboarding: true });
  const profile = await getProfile(user.id);

  const greetingName = profile?.name?.split(" ")[0] || user.firstName || user.name?.split(" ")[0] || "Coach User";
  const activeFocus = profile?.challenge || "Executive Presence & Public Speaking";
  const activeGoal = profile?.monthlyGoal || "Practicing steady pacing and eliminating filler words when presenting architecture proposals to executive stakeholders.";

  return (
    <div>
      <AppHeader
        title={`Welcome back, ${greetingName}`}
        description="Monitor your active confidence focus areas and quick coaching entry points."
        actions={
          <Link href={ROUTES.app.coach}>
            <Button size="sm" className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Start Session</span>
            </Button>
          </Link>
        }
      />

      <div className="py-8">
        <Container size="default" className="space-y-6">
          {/* Active Focus Card */}
          <Card className="bg-panel border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <div className="text-[11.5px] uppercase tracking-wider text-text-muted font-medium">
                  Active Focus Area
                </div>
                <CardTitle className="text-[16px] mt-1">
                  {activeFocus}
                </CardTitle>
              </div>
              <Badge variant="accent">In Progress</Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Current Monthly Goal: {activeGoal}
              </p>


              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href={ROUTES.app.coach}>
                  <Button size="sm" className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Practice High-Stakes Roleplay</span>
                  </Button>
                </Link>
                <Link href={ROUTES.app.progress}>
                  <Button variant="secondary" size="sm">
                    View Progress Analytics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="text-[12px] text-text-secondary">Current Confidence Index</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[22px] font-semibold text-text-primary">7.4</span>
                  <span className="text-[12px] text-success font-medium">+1.4 from baseline</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="text-[12px] text-text-secondary">Micro-Actions Executed</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[22px] font-semibold text-text-primary">12</span>
                  <span className="text-[12px] text-text-muted">this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="text-[12px] text-text-secondary">Next Check-In Dispatch</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[16px] font-semibold text-text-primary">Monday 09:00</span>
                  <span className="text-[11.5px] text-accent">Automated</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Action Rows */}
          <Card className="bg-panel border-border">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="text-[13.5px] font-medium text-text-primary">
                Pending Micro-Actions
              </div>
              <Badge variant="secondary">3 Available</Badge>
            </div>
            <div>
              <DenseRow
                label="Voice Pacing Drill"
                description="Deliver 2-minute project summary with intentional 2-second pauses."
                action={
                  <Button variant="secondary" size="sm">
                    Complete
                  </Button>
                }
              />
              <DenseRow
                label="Pre-Meeting Grounding"
                description="Perform 3 box-breathing cycles prior to senior sync."
                action={
                  <Button variant="secondary" size="sm">
                    Complete
                  </Button>
                }
              />
              <DenseRow
                label="Weekly Wins Log"
                description="Document two times you stood firm on an architecture decision."
                action={
                  <Button variant="secondary" size="sm">
                    Complete
                  </Button>
                }
              />
            </div>
          </Card>
        </Container>
      </div>
    </div>
  );
}
