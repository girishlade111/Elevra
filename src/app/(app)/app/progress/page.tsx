import Link from "next/link";
import {
  TrendingUp,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/config/routes";
import { requireAuth } from "@/lib/auth/require-auth";
import { getProgressData } from "@/db/repositories/dashboard.repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Progress & Metrics | Elevra",
  description: "Verified metrics, topic distribution, and interaction history derived from real coaching data.",
};

export default async function ProgressPage() {
  const user = await requireAuth({ requireOnboarding: true });
  const data = await getProgressData(user.id);

  const {
    profile,
    totalConversations,
    totalMessages,
    conversationsThisMonth,
    messagesThisMonth,
    usageSummary,
    intentDistribution,
    recentConversations,
    totalCheckinsSent,
  } = data;

  const monthlyGoal = profile?.monthlyGoal || "No monthly goal defined. Set one in your profile settings.";
  const primaryChallenge = profile?.challenge || "General career confidence";
  const careerStage = profile?.careerStage || "Professional";

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
        title="Coaching Progress & Insights"
        description="Empirical engagement metrics, topic distribution, and session history derived from your stored activity."
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
          {/* Active Framework Context */}
          <Card className="bg-panel border-border">
            <CardHeader className="p-4 sm:p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 bg-surface-secondary/30">
              <div className="space-y-1">
                <div className="text-[11.5px] uppercase tracking-wider text-text-muted font-medium">
                  Active Focus & Objective
                </div>
                <CardTitle className="text-[15px] font-semibold text-text-primary">
                  {primaryChallenge}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-border bg-surface-secondary text-text-secondary text-[11.5px]">
                  {careerStage}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-2">
              <div className="text-[12px] font-medium text-text-muted uppercase tracking-wider">
                Monthly Goal
              </div>
              <p className="text-[13.5px] text-text-primary leading-relaxed">
                {monthlyGoal}
              </p>
            </CardContent>
          </Card>

          {/* Activity Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-[12px] text-text-muted">
                  <span>Total Sessions</span>
                  <MessageSquare className="h-3.5 w-3.5 text-text-muted" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[24px] font-bold text-text-primary">
                    {totalConversations}
                  </span>
                  <span className="text-[11.5px] text-text-secondary">
                    ({conversationsThisMonth} this mo)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-[12px] text-text-muted">
                  <span>Total Messages</span>
                  <Zap className="h-3.5 w-3.5 text-text-muted" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[24px] font-bold text-text-primary">
                    {totalMessages}
                  </span>
                  <span className="text-[11.5px] text-text-secondary">
                    ({messagesThisMonth} this mo)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-[12px] text-text-muted">
                  <span>AI Tokens Ingested</span>
                  <Cpu className="h-3.5 w-3.5 text-text-muted" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[24px] font-bold text-text-primary">
                    {usageSummary.totalTokens > 0
                      ? usageSummary.totalTokens.toLocaleString()
                      : "0"}
                  </span>
                  <span className="text-[11.5px] text-text-secondary">tokens</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-[12px] text-text-muted">
                  <span>Check-Ins Delivered</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-text-muted" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[24px] font-bold text-text-primary">
                    {totalCheckinsSent}
                  </span>
                  <span className="text-[11.5px] text-text-secondary">summaries</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Intent Distribution & Focus Topics */}
          <Card className="bg-panel border-border">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 flex items-center justify-between">
              <div>
                <CardTitle className="text-[15px] font-semibold text-text-primary">
                  Topic & Intent Distribution
                </CardTitle>
                <div className="text-[12px] text-text-secondary mt-0.5">
                  Proportion of coaching dialogues by detected cognitive behavioral category
                </div>
              </div>
              <Badge variant="outline" className="border-border text-[11px] text-text-muted">
                Empirical
              </Badge>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {intentDistribution.length === 0 ? (
                <div className="text-center py-6 text-[13px] text-text-secondary">
                  No topic data yet. Start your first session to map your focus distribution.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {intentDistribution.map((item) => (
                    <div key={item.intent} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="font-medium text-text-primary capitalize">
                          {item.intent.replace(/_/g, " ")}
                        </span>
                        <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                          <span>{item.count} {item.count === 1 ? "turn" : "turns"}</span>
                          <span className="font-medium text-text-primary">{item.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-surface-secondary rounded-full overflow-hidden border border-border/50">
                        <div
                          className="h-full bg-accent transition-all duration-500 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session History Log */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="text-[13.5px] font-medium text-text-primary">
                Coaching Dialogue Timeline
              </div>
              {recentConversations.length > 0 && (
                <span className="text-[12px] text-text-muted">
                  Showing latest {recentConversations.length} sessions
                </span>
              )}
            </div>

            {recentConversations.length === 0 ? (
              <Card className="bg-panel border-border text-center py-10 px-4 space-y-3">
                <div className="h-10 w-10 rounded-full bg-surface-secondary text-accent flex items-center justify-center mx-auto">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <div className="text-[14px] font-medium text-text-primary">No activity logged yet</div>
                  <p className="text-[12.5px] text-text-secondary leading-relaxed">
                    Once you start coaching dialogues, your engagement metrics and session timelines will appear here.
                  </p>
                </div>
                <Link href={ROUTES.app.coach}>
                  <Button size="sm" className="bg-accent hover:bg-accent-hover text-accent-foreground gap-1.5 h-8">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Begin Coaching</span>
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
                          <span>Review</span>
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
