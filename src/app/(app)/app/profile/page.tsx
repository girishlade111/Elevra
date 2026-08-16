import Link from "next/link";
import { User, Settings, Sparkles, Calendar, Target, ShieldCheck, Mail } from "lucide-react";
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

export const metadata = {
  title: "Profile | Elevra",
  description: "Your personalized executive coaching calibration, career stage, and objectives.",
};

export default async function ProfilePage() {
  const user = await requireAuth({ requireOnboarding: true });
  const profile = await getProfile(user.id);

  const displayName = profile?.name || user.firstName || user.name || "Client";
  const userEmail = profile?.email || user.email || "";
  const careerStage = profile?.careerStage || "Professional";
  const challenge = profile?.challenge || "General career confidence and executive presence";
  const monthlyGoal = profile?.monthlyGoal || "Set your primary monthly objective in settings.";

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Recently joined";
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return String(date);
    }
  };

  return (
    <div>
      <AppHeader
        title="Executive Profile"
        description="Comprehensive summary of your calibration parameters, goals, and behavioral focus areas."
        actions={
          <Link href={ROUTES.app.settings.profile}>
            <Button size="sm" className="bg-accent hover:bg-accent-hover text-accent-foreground flex items-center gap-1.5 h-8">
              <Settings className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </Button>
          </Link>
        }
      />

      <div className="py-6 sm:py-8">
        <Container size="default" className="space-y-6">
          {/* Main Calibration Card */}
          <Card className="bg-panel border-border">
            <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 bg-surface-secondary/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-accent">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-[16px] font-semibold text-text-primary">
                    {displayName}
                  </CardTitle>
                  <div className="text-[12px] text-text-muted flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3 w-3" />
                    <span>{userEmail}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-border bg-surface-secondary text-text-secondary text-[11.5px]">
                  {careerStage}
                </Badge>
                <Badge variant="accent" className="flex items-center gap-1 text-[11px]">
                  <Sparkles className="h-3 w-3" />
                  <span>Calibrated</span>
                </Badge>
              </div>
            </CardHeader>

            <div>
              <DenseRow
                label="Authentication Identity"
                description="Managed securely via Clerk Authentication • Read-only identity"
                action={
                  <Badge variant="outline" className="text-[11px] border-border bg-surface-secondary text-text-muted flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-success" />
                    <span>Verified</span>
                  </Badge>
                }
              />
              <DenseRow
                label="Career Stage"
                description={careerStage}
              />
              <DenseRow
                label="Primary Behavioral Challenge"
                description={challenge}
                action={<Badge variant="outline" className="text-[11px] border-accent/30 text-accent bg-accent/5">Active Focus</Badge>}
              />
              <DenseRow
                label="Current Monthly Objective"
                description={monthlyGoal}
              />
              <DenseRow
                label="Member Since"
                description={formatDate(profile?.joinedAt || profile?.createdAt)}
                action={
                  <div className="text-[11.5px] text-text-muted flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Active</span>
                  </div>
                }
              />
            </div>
          </Card>

          {/* Quick Settings Hub Jump Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Link
              href={ROUTES.app.settings.profile}
              className="p-4 rounded-md border border-border bg-panel hover:bg-surface-hover hover:border-text-muted/40 transition-colors space-y-1.5 group"
            >
              <div className="flex items-center justify-between text-[13px] font-medium text-text-primary group-hover:text-accent transition-colors">
                <span>Update Goals</span>
                <Target className="h-3.5 w-3.5 text-text-muted" />
              </div>
              <p className="text-[11.5px] text-text-muted leading-relaxed">
                Refine your immediate challenge, career stage, and target monthly outcomes.
              </p>
            </Link>

            <Link
              href={ROUTES.app.settings.email}
              className="p-4 rounded-md border border-border bg-panel hover:bg-surface-hover hover:border-text-muted/40 transition-colors space-y-1.5 group"
            >
              <div className="flex items-center justify-between text-[13px] font-medium text-text-primary group-hover:text-accent transition-colors">
                <span>Email Preferences</span>
                <Mail className="h-3.5 w-3.5 text-text-muted" />
              </div>
              <p className="text-[11.5px] text-text-muted leading-relaxed">
                Configure Resend or Gmail SMTP for automated weekly executive briefings.
              </p>
            </Link>

            <Link
              href={ROUTES.app.settings.root}
              className="p-4 rounded-md border border-border bg-panel hover:bg-surface-hover hover:border-text-muted/40 transition-colors space-y-1.5 group"
            >
              <div className="flex items-center justify-between text-[13px] font-medium text-text-primary group-hover:text-accent transition-colors">
                <span>Account &amp; Privacy</span>
                <Settings className="h-3.5 w-3.5 text-text-muted" />
              </div>
              <p className="text-[11.5px] text-text-muted leading-relaxed">
                Data export, session security, and conversation privacy controls.
              </p>
            </Link>
          </div>
        </Container>
      </div>
    </div>
  );
}
