"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Trash2, MessageSquare, Plus, Clock, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/config/routes";

export interface HistoryConversationItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessagePreview: string | null;
  lastIntent: string | null;
}

interface HistoryListViewProps {
  initialConversations: HistoryConversationItem[];
}

export function HistoryListView({ initialConversations }: HistoryListViewProps) {
  const [conversations, setConversations] = React.useState<HistoryConversationItem[]>(initialConversations);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="text-[13.5px] font-medium text-text-primary">
            {conversations.length} {conversations.length === 1 ? "Session" : "Sessions"}
          </div>
          <div className="text-[12px] text-text-muted">
            All your archived conversations and structured action items
          </div>
        </div>

        <Link href={ROUTES.app.coach}>
          <Button size="sm" className="bg-accent hover:bg-accent-hover text-accent-foreground gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            <span>New Session</span>
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {conversations.length === 0 && (
        <div className="text-center py-16 px-4 rounded-md border border-border bg-panel space-y-4">
          <div className="h-12 w-12 rounded-full bg-surface-secondary text-accent flex items-center justify-center mx-auto">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <div className="text-[15px] font-semibold text-text-primary">No coaching history yet</div>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Start your first coaching session to rehearse key conversations, overcome imposter feelings, or negotiate compensation.
            </p>
          </div>
          <Link href={ROUTES.app.coach}>
            <Button size="sm" className="bg-accent hover:bg-accent-hover text-accent-foreground gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Start First Session</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Conversation Cards */}
      <div className="space-y-3">
        {conversations.map((session) => (
          <Card
            key={session.id}
            className="bg-panel border-border hover:border-text-muted/40 transition-colors"
          >
            <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-[14.5px] font-semibold text-text-primary hover:text-accent transition-colors">
                    <Link href={ROUTES.app.coachConversation(session.id)}>
                      {session.title}
                    </Link>
                  </CardTitle>
                  {session.lastIntent && (
                    <Badge
                      variant="outline"
                      className="text-[11px] font-normal border-border bg-surface-secondary text-text-secondary capitalize"
                    >
                      {session.lastIntent.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>

                {session.lastMessagePreview && (
                  <CardDescription className="text-[12.5px] text-text-secondary line-clamp-2 leading-relaxed">
                    {session.lastMessagePreview}
                  </CardDescription>
                )}

                <div className="flex items-center gap-4 text-[11.5px] text-text-muted pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(session.updatedAt)}</span>
                  </div>
                  <span>•</span>
                  <span>{session.messageCount} {session.messageCount === 1 ? "exchange" : "exchanges"}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Link href={ROUTES.app.coachConversation(session.id)}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 px-3 text-[12px] bg-surface-secondary border-border hover:bg-surface-hover gap-1.5"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>

                {confirmDeleteId === session.id ? (
                  <div className="flex items-center gap-1 bg-surface-secondary border border-border rounded px-1.5 py-1">
                    <span className="text-[11px] text-danger font-medium">Delete?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(session.id)}
                      disabled={deletingId === session.id}
                      className="text-[11px] px-1 text-danger font-bold hover:underline"
                    >
                      {deletingId === session.id ? "..." : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[11px] px-1 text-text-muted hover:text-text-primary"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDeleteId(session.id)}
                    className="h-8 px-2 text-text-muted hover:text-danger hover:bg-surface-secondary"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
