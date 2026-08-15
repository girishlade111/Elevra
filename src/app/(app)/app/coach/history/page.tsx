import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/config/routes";

export default function CoachHistoryPage() {
  const sessions = [
    {
      id: "conv_101",
      title: "Preparation for Executive Architecture Review",
      date: "August 12, 2026",
      intent: "roleplay_practice",
      summary: "Rehearsed technical tradeoffs, addressed hesitation, and structured opening statements.",
      messagesCount: 8,
    },
    {
      id: "conv_102",
      title: "Overcoming Imposter Thoughts on Team Lead Promotion",
      date: "August 8, 2026",
      intent: "mindset_reframing",
      summary: "Identified cognitive distortions regarding past accomplishments and created factual victory ledger.",
      messagesCount: 12,
    },
    {
      id: "conv_103",
      title: "Quarterly Performance & Salary Negotiation",
      date: "August 2, 2026",
      intent: "action_planning",
      summary: "Outlined value deliverables and scripted assertiveness anchor points.",
      messagesCount: 6,
    },
  ];

  return (
    <div>
      <AppHeader
        title="Coaching History"
        description="Review past coaching dialogues, breakthrough insights, and completed action items."
      />

      <div className="py-8">
        <Container size="default" className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="bg-panel border-border">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-[14px] font-semibold">{session.title}</CardTitle>
                    <Badge variant="accent">{session.intent.replace("_", " ")}</Badge>
                  </div>
                  <CardDescription className="text-[12.5px] text-text-secondary">
                    {session.summary}
                  </CardDescription>
                  <div className="text-[11.5px] text-text-muted pt-1">
                    {session.date} • {session.messagesCount} exchanges
                  </div>
                </div>

                <Link href={ROUTES.app.coachConversation(session.id)}>
                  <Button variant="secondary" size="sm" className="flex items-center gap-1.5 shrink-0">
                    <span>View Transcript</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
            </Card>
          ))}
        </Container>
      </div>
    </div>
  );
}
