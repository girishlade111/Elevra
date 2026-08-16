import { requireAuth } from "@/lib/auth/require-auth";
import { AppHeader } from "@/components/layout/app-header";
import { Container } from "@/components/layout/container";
import { listConversationsWithDetails } from "@/db/repositories/conversation.repository";
import { HistoryListView, type HistoryConversationItem } from "@/components/coach/history-list-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Coaching History | Elevra",
  description: "Review past coaching dialogues, breakthrough insights, and completed action items.",
};

export default async function CoachHistoryPage() {
  const user = await requireAuth({ requireOnboarding: true });

  const rawConversations = await listConversationsWithDetails(user.id, 100);

  const formattedConversations: HistoryConversationItem[] = rawConversations.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    messageCount: c.messageCount,
    lastMessagePreview: c.lastMessagePreview,
    lastIntent: c.lastIntent,
  }));

  return (
    <div>
      <AppHeader
        title="Coaching History"
        description="Review past coaching dialogues, breakthrough insights, and structured action items."
      />

      <div className="py-6 sm:py-8">
        <Container size="default">
          <HistoryListView initialConversations={formattedConversations} />
        </Container>
      </div>
    </div>
  );
}
