import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { requireAuth } from "@/lib/auth/require-auth";
import { getConversation } from "@/db/repositories/conversation.repository";
import { getMessages } from "@/db/repositories/message.repository";
import { CoachChatView, type ChatMessageItem } from "@/components/coach/coach-chat-view";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { ROUTES } from "@/config/routes";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return {
    title: `Coaching Session | Elevra`,
    description: `Active coaching session dialogue (${conversationId}).`,
  };
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const user = await requireAuth({ requireOnboarding: true });
  const { conversationId } = await params;

  // Strict user isolation check
  const conversation = await getConversation(conversationId, user.id);

  if (!conversation) {
    return (
      <div className="py-12">
        <Container size="default">
          <div className="max-w-md mx-auto rounded-md border border-border bg-panel p-6 text-center space-y-4">
            <div className="h-10 w-10 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-[16px] font-semibold text-text-primary">
                Session Not Found
              </h2>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                This coaching session does not exist or you do not have permission to view it.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Link href={ROUTES.app.coachHistory}>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to History</span>
                </Button>
              </Link>
              <Link href={ROUTES.app.coach}>
                <Button size="sm" className="bg-accent hover:bg-accent-hover text-accent-foreground">
                  New Session
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const rawMessages = await getMessages(conversation.id, user.id);

  const formattedMessages: ChatMessageItem[] = rawMessages.map((m) => {
    let structured = null;
    if (m.role === "assistant") {
      try {
        structured = JSON.parse(m.content);
      } catch {
        structured = null;
      }
    }

    return {
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      structured,
      intent: m.intent,
      timestamp: new Date(m.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  });

  return (
    <CoachChatView
      initialConversationId={conversation.id}
      initialTitle={conversation.title}
      initialMessages={formattedMessages}
    />
  );
}
