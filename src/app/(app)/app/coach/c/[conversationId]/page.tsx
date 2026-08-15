import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/config/routes";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  return (
    <div>
      <AppHeader
        title={`Session Transcript: ${conversationId}`}
        description="Archived coaching dialogue and cognitive breakdown."
        actions={
          <Link href={ROUTES.app.coachHistory}>
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to History</span>
            </Button>
          </Link>
        }
      />

      <div className="py-8">
        <Container size="default" className="space-y-4">
          <Card className="bg-panel border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-[15px]">Session Overview</CardTitle>
              <Badge variant="accent">Completed</Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-[13px] text-text-secondary">
              <div className="p-3 bg-surface-secondary border border-border rounded-[4px] space-y-1">
                <div className="text-[12px] font-medium text-text-primary">Key Breakthrough</div>
                <p>
                  Recognized hesitation pattern in opening slide transitions. Implemented 2-second silent grounding anchor prior to speaking.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-[12px] font-medium uppercase tracking-wider text-text-muted">
                  Transcript Log
                </div>
                <div className="p-3 border border-border bg-surface-secondary/40 rounded-[4px] space-y-1">
                  <div className="text-[11.5px] font-semibold text-text-primary">User</div>
                  <p className="text-[13px] text-text-secondary">
                    "I find myself speaking too fast whenever senior leaders ask a follow-up question."
                  </p>
                </div>
                <div className="p-3 border border-border bg-panel rounded-[4px] space-y-1">
                  <div className="text-[11.5px] font-semibold text-accent">AI Coach</div>
                  <p className="text-[13px] text-text-secondary">
                    "Fast pacing is an autonomic defense response to fill silence. Silence feels dangerous, but to executives, silence signifies thoughtfulness."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </div>
    </div>
  );
}
