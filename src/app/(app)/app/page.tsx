import Link from "next/link";
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Mail,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/config/routes";
import { requireAuth } from "@/lib/auth/require-auth";
import { getDashboardData } from "@/db/repositories/dashboard.repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | Elevra",
  description: "Your personalized executive coaching overview, focus areas, and activity metrics.",
};

export default async function DashboardPage() {
  const user = await requireAuth({ requireOnboarding: true });
  const data = await getDashboardData(user.id);

  const {
    profile,
    emailPreference,
    recentConversations,
    recentIntents,
    conversationsThisMonth,
    messagesThisMonth,
    totalCheckinsSent,
    latestConversationId,
  } = data;

  // Real user greeting
  const greetingName =
    profile?.name?.split(" ")[0] ||
    user.firstName ||
    user.name?.split(" ")[0] ||
    "Professional";

  const monthlyGoal = profile?.monthlyGoal || "Set your primary monthly objective in profile settings.";
  const primaryChallenge = profile?.challenge || "General career confidence & assertive communication";
  const careerStage = profile?.careerStage || "Professional";

  const isEmailActive = emailPreference?.weeklyCheckinsEnabled ?? true;
  const emailProvider = emailPreference?.provider || "resend";
  const destinationEmail = emailPreference?.destinationEmail || profile?.email || user.email;

  const formatDate = (isoString: string | Date) => {
    try {
      const date = typeof isoString === "string" ? new Date(isoString) : isoString;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return String(isoString);
    }
  };

  return (
    <div>
      <AppHeader
        title={`Welcome back, ${greetingName}`}
        description="Monitor your active coaching objectives, verified message activity, and weekly digest status."
        actions={
          <Link href={ROUTES.app.coach}>
            <Button size="sm" className="bg-accent hover:bg-accent-hover text-accent-foreground flex items-center gap-1.5 h-8">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Start Session</span>
            </Button>
          </Link>
        }
      />

      <div className="py-6 sm:py-8">
        <Container size="default" className="space-y-6">
          {/* Active Goal & Focus Overview Card */}
          <Card className="bg-panel border-border">
            <CardHeader className="p-4 sm:p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 bg-surface-secondary/30">
              <div className="space-y-1">
                <div className="text-[11.5px] uppercase tracking-wider text-text-muted font-medium">
                  Primary Focus & Career Stage
                </div>
                <CardTitle className="text-[15px] font-semibold text-text-primary">
                  {primaryChallenge}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="border-border bg-surface-secondary text-text-secondary text-[11.5px]">
                  {careerStage}
                </Badge>
                <Badge variant="accent" className="text-[11px]">
                  Active Goal
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="text-[12px] font-medium text-text-muted uppercase tracking-wider">
                  Current Monthly Goal
                </div>
                <p className="text-[13.5px] text-text-primary leading-relaxed">
                  {monthlyGoal}
                </p>
              </div>

              {recentIntents.length > 0 && (
                <div className="pt-2 border-t border-border/60 flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] text-text-muted">Recent Focus Topics:</span>
                  {recentIntents.map((intent) => (
                    <Badge
                      key={intent}
                      variant="outline"
                      className="text-[11px] font-normal border-border bg-surface-secondary text-text-secondary capitalize"
                    >
                      {intent.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real Metrics Grid (Strictly derived from Neon DB) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="text-[12px] text-text-muted">Conversations This Month</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[24px] font-bold text-text-primary">
                    {conversationsThisMonth}
                  </span>
                  <span className="text-[11.5px] text-text-secondary">sessions</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="text-[12px] text-text-muted">Messages Exchanged</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[24px] font-bold text-text-primary">
                    {messagesThisMonth}
                  </span>
                  <span className="text-[11.5px] text-text-secondary">this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="text-[12px] text-text-muted">Weekly Check-Ins Sent</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[24px] font-bold text-text-primary">
                    {totalCheckinsSent}
                  </span>
                  <span className="text-[11.5px] text-text-secondary">digests</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="text-[12px] text-text-muted">Email Delivery Status</div>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {isEmailActive ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-[13.5px] font-medium text-text-primary capitalize">
                        {emailProvider} Active
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-text-muted" />
                      <span className="text-[13.5px] font-medium text-text-muted">
                        Paused
                      </span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  To: {destinationEmail}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Bar */}
          <div className="space-y-2">
            <div className="text-[12px] font-medium uppercase tracking-wider text-text-muted px-1">
              Quick Actions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              <Link
                href={ROUTES.app.coach}
                className="p-3 rounded-md border border-border bg-panel hover:bg-surface-hover hover:border-text-muted/40 transition-colors flex items-center gap-2.5 text-left group"
              >
                <div className="h-7 w-7 rounded bg-surface-secondary border border-border flex items-center justify-center text-accent shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                    Start Session
                  </div>
                  <div className="text-[11px] text-text-muted truncate">New AI coaching turn</div>
                </div>
              </Link>

              {latestConversationId ? (
                <Link
                  href={ROUTES.app.coachConversation(latestConversationId)}
                  className="p-3 rounded-md border border-border bg-panel hover:bg-surface-hover hover:border-text-muted/40 transition-colors flex items-center gap-2.5 text-left group"
                >
                  <div className="h-7 w-7 rounded bg-surface-secondary border border-border flex items-center justify-center text-text-secondary shrink-0">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                      Continue Chat
                    </div>
                    <div className="text-[11px] text-text-muted truncate">Resume latest session</div>
                  </div>
                </Link>
              ) : (
                <Link
                  href={ROUTES.app.coach}
                  className="p-3 rounded-md border border-border bg-panel hover:bg-surface-hover hover:border-text-muted/40 transition-colors flex items-center gap-2.5 text-left group"
                >
                  <div className="h-7 w-7 rounded bg-surface-secondary border border-border flex items-center justify-center text-text-secondary shrink-0">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                      First Dialogue
                    </div>
                    <div className="text-[11px] text-text-muted truncate">Begin coaching</div>
                  </div>
                </Link>
              )}

              <Link
                href={ROUTES.app.progress}
                className="p-3 rounded-md border border-border bg-panel hover:bg-surface-hover hover:border-text-muted/40 transition-colors flex items-center gap-2.5 text-left group"
              >
                <div className="h-7 w-7 rounded bg-surface-secondary border border-border flex items-center justify-center text-text-secondary shrink-0">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                    View Progress
                  </div>
                  <div className="text-[11px] text-text-muted truncate">Real metrics & activity</div>
                </div>
              </Link>

              <Link
                href={ROUTES.app.checkIns}
                className="p-3 rounded-md border border-border bg-panel hover:bg-surface-hover hover:border-text-muted/40 transition-colors flex items-center gap-2.5 text-left group"
              >
                <div className="h-7 w-7 rounded bg-surface-secondary border border-border flex items-center justify-center text-text-secondary shrink-0">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                    Check-In Logs
                  </div>
                  <div className="text-[11px] text-text-muted truncate">Weekly email digests</div>
                </div>
              </Link>

              <Link
                href={ROUTES.app.settings.profile}
                className="p-3 rounded-md border border-border bg-panel hover:bg-surface-hover hover:border-text-muted/40 transition-colors flex items-center gap-2.5 text-left group"
              >
                <div className="h-7 w-7 rounded bg-surface-secondary border border-border flex items-center justify-center text-text-secondary shrink-0">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                    Edit Profile
                  </div>
                  <div className="text-[11px] text-text-muted truncate">Update goals & role</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Coaching Sessions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="text-[13.5px] font-medium text-text-primary">
                Recent Coaching Sessions
              </div>
              {recentConversations.length > 0 && (
                <Link
                  href={ROUTES.app.coachHistory}
                  className="text-[12px] text-text-secondary hover:text-accent flex items-center gap-1 transition-colors"
                >
                  <span>View all</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {recentConversations.length === 0 ? (
              <Card className="bg-panel border-border text-center py-10 px-4 space-y-3">
                <div className="h-10 w-10 rounded-full bg-surface-secondary text-accent flex items-center justify-center mx-auto">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <div className="text-[14px] font-medium text-text-primary">No coaching conversations yet</div>
                  <p className="text-[12.5px] text-text-secondary leading-relaxed">
                    Start your first session to receive structured cognitive guidance and actionable micro-experiments.
                  </p>
                </div>
                <Link href={ROUTES.app.coach}>
                  <Button size="sm" className="bg-accent hover:bg-accent-hover text-accent-foreground gap-1.5 h-8">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Start First Session</span>
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {recentConversations.map((conv) => (
                  <Card
                    key={conv.id}
                    className="bg-panel border-border hover:border-text-muted/40 transition-colors"
                  >
                    <CardHeader className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold text-text-primary hover:text-accent transition-colors">
                            <Link href={ROUTES.app.coachConversation(conv.id)}>
                              {conv.title}
                            </Link>
                          </span>
                          {conv.lastIntent && (
                            <Badge
                              variant="outline"
                              className="text-[11px] font-normal border-border bg-surface-secondary text-text-secondary capitalize"
                            >
                              {conv.lastIntent.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>

                        {conv.lastMessagePreview && (
                          <p className="text-[12.5px] text-text-secondary line-clamp-1">
                            {conv.lastMessagePreview}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11.5px] text-text-muted pt-0.5">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(conv.updatedAt)}</span>
                          </div>
                          <span>•</span>
                          <span>{conv.messageCount} {conv.messageCount === 1 ? "turn" : "turns"}</span>
                        </div>
                      </div>

                      <Link href={ROUTES.app.coachConversation(conv.id)}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 px-2.5 text-[11.5px] bg-surface-secondary border-border hover:bg-surface-hover gap-1 shrink-0 self-end sm:self-center"
                        >
                          <span>Open</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Container>
      </div>
    </div>
  );
}
