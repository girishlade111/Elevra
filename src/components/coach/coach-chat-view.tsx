"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Loader2,
  History,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AssistantMessageCard } from "./assistant-message-card";
import { ROUTES } from "@/config/routes";
import type { AICoachingResponse } from "@/lib/ai/schemas";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  structured?: AICoachingResponse | null;
  intent?: string | null;
  timestamp: string;
}

interface CoachChatViewProps {
  initialConversationId?: string | null;
  initialTitle?: string | null;
  initialMessages?: ChatMessageItem[];
}

const STARTER_PROMPTS = [
  {
    title: "Salary Negotiation",
    prompt: "Help me prepare for a salary conversation",
    intent: "salary",
  },
  {
    title: "Interview Prep",
    prompt: "I have an interview coming up",
    intent: "interview",
  },
  {
    title: "Meeting Presence",
    prompt: "I need confidence in meetings",
    intent: "confidence",
  },
  {
    title: "Career Pivot",
    prompt: "I want to change careers",
    intent: "career_change",
  },
  {
    title: "Work-Life Balance",
    prompt: "I am struggling with work-life balance",
    intent: "balance",
  },
];

export function CoachChatView({
  initialConversationId = null,
  initialTitle = null,
  initialMessages = [],
}: CoachChatViewProps) {
  const router = useRouter();
  const [conversationId, setConversationId] = React.useState<string | null>(initialConversationId);
  const [title, setTitle] = React.useState<string>(initialTitle || "New Coaching Session");
  const [messages, setMessages] = React.useState<ChatMessageItem[]>(initialMessages);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastSentMessage, setLastSentMessage] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  React.useEffect(() => {
    scrollToBottom(messages.length <= 2 ? "auto" : "smooth");
  }, [messages, loading, scrollToBottom]);

  // Adjust textarea height dynamically
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend ?? input;
    const trimmed = rawText.trim();
    if (!trimmed || loading) return;

    setError(null);
    setInput("");
    setLastSentMessage(trimmed);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const tempUserId = `usr_${Date.now()}`;
    const userMsg: ChatMessageItem = {
      id: tempUserId,
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        message: trimmed,
        clientMessageId: tempUserId,
      };
      if (conversationId) {
        payload.conversationId = conversationId;
      }

      const res = await fetch(ROUTES.api.chat, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg =
          json?.error?.message || "Failed to communicate with AI Coach. Please try again.";
        setError(errorMsg);
        return;
      }

      const { data } = json;
      const returnedConvId = data.conversationId;

      // If we just created a conversation, update state and replace browser URL quietly
      if (!conversationId && returnedConvId) {
        setConversationId(returnedConvId);
        window.history.replaceState(null, "", `/app/coach/c/${returnedConvId}`);
      }

      const assistantMsg: ChatMessageItem = {
        id: `ast_${Date.now()}`,
        role: "assistant",
        content: JSON.stringify(data.response),
        structured: data.response,
        intent: data.intent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("[CoachChatView] Request failed:", err);
      setError(
        "Network connection interrupted. Please check your internet connection and retry."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetry = () => {
    if (lastSentMessage) {
      // Remove the last pending user message if present to avoid duplication
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1]?.role === "user") {
          return prev.slice(0, -1);
        }
        return prev;
      });
      handleSendMessage(lastSentMessage);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId || isDeleting) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        router.push(ROUTES.app.coach);
        router.refresh();
      } else {
        setError(json?.error?.message || "Failed to delete conversation.");
        setShowDeleteConfirm(false);
      }
    } catch {
      setError("Network error while deleting conversation.");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartNewSession = () => {
    if (conversationId) {
      router.push(ROUTES.app.coach);
    } else {
      setMessages([]);
      setInput("");
      setError(null);
      setConversationId(null);
      setTitle("New Coaching Session");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-background">
      {/* Coach Header */}
      <header className="border-b border-border bg-panel/90 backdrop-blur px-4 py-3 sticky top-0 z-10 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded bg-surface-secondary border border-border flex items-center justify-center text-accent shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[14px] font-semibold text-text-primary truncate">
                  {conversationId && title ? title : "AI Confidence Coach"}
                </h1>
                <Badge
                  variant="outline"
                  className="hidden sm:inline-flex text-[10.5px] font-normal border-border bg-surface-secondary text-text-muted"
                >
                  NVIDIA NIM
                </Badge>
              </div>
              <p className="text-[11.5px] text-text-muted truncate">
                Cognitive behavioral guidance & assertive communication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link href={ROUTES.app.coachHistory}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-[12px] text-text-secondary hover:text-text-primary gap-1.5"
                title="View past coaching sessions"
              >
                <History className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">History</span>
              </Button>
            </Link>

            {conversationId && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartNewSession}
                  className="h-8 px-2.5 text-[12px] text-text-secondary hover:text-text-primary gap-1.5"
                  title="Start a new coaching session"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">New Session</span>
                </Button>

                {showDeleteConfirm ? (
                  <div className="flex items-center gap-1 bg-surface-secondary border border-border rounded px-1.5 py-0.5">
                    <span className="text-[11px] text-danger font-medium">Delete?</span>
                    <button
                      type="button"
                      onClick={handleDeleteConversation}
                      disabled={isDeleting}
                      className="text-[11px] px-1.5 py-0.5 text-danger font-semibold hover:underline"
                    >
                      {isDeleting ? "..." : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="text-[11px] px-1.5 py-0.5 text-text-muted hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-8 px-2 text-[12px] text-text-muted hover:text-danger"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6"
        role="log"
        aria-live="polite"
        aria-label="Coaching conversation transcript"
      >
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Empty State / Starter Prompts */}
          {messages.length === 0 && (
            <div className="py-6 space-y-6">
              <div className="text-center space-y-2 max-w-lg mx-auto">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-surface-secondary border border-border text-accent mb-2">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-[17px] font-semibold text-text-primary">
                  What would you like to work through today?
                </h2>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  Elevra provides structured cognitive behavioral frameworks to help you prepare for
                  high-stakes conversations, dismantle imposter self-talk, and communicate with authority.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1 text-[11.5px] text-text-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  <span>Private, confidential & tailored to your career stage</span>
                </div>
              </div>

              {/* Starter Prompt Cards */}
              <div className="space-y-2 pt-2">
                <div className="text-[11.5px] font-medium uppercase tracking-wider text-text-muted px-1">
                  Recommended Starters
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {STARTER_PROMPTS.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => handleSendMessage(item.prompt)}
                      disabled={loading}
                      className="text-left p-3.5 rounded-md border border-border bg-panel hover:bg-surface-hover hover:border-text-muted/40 transition-colors group flex items-start justify-between gap-2"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-[12.5px] font-medium text-text-primary group-hover:text-accent transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[12px] text-text-secondary line-clamp-2">
                          &ldquo;{item.prompt}&rdquo;
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-text-primary shrink-0 transition-transform group-hover:translate-x-0.5 mt-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rendered Message List */}
          {messages.map((m) => {
            if (m.role === "assistant") {
              return (
                <AssistantMessageCard
                  key={m.id}
                  content={m.content}
                  structured={m.structured}
                  intent={m.intent}
                  timestamp={m.timestamp}
                />
              );
            }

            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-md border border-border bg-surface-secondary p-3.5 text-[13.5px] leading-relaxed text-text-primary space-y-1">
                  <div className="flex items-center justify-between gap-4 text-[11px] text-text-muted pb-1 border-b border-border/50">
                    <span className="font-medium text-text-secondary">You</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap pt-0.5">{m.content}</div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="rounded-md border border-border bg-panel p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                <span>Elevra Coach is analyzing your challenge & generating behavioral guidance...</span>
              </div>
              <div className="h-3 bg-surface-secondary rounded w-3/4" />
              <div className="h-3 bg-surface-secondary rounded w-1/2" />
            </div>
          )}

          {/* Error Banner with Retry */}
          {error && (
            <div className="rounded-md border border-danger/40 bg-danger/10 p-3.5 text-[13px] text-text-primary flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-danger">Coaching session interrupted</div>
                  <div className="text-text-secondary text-[12px] mt-0.5">{error}</div>
                </div>
              </div>
              {lastSentMessage && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleRetry}
                  disabled={loading}
                  className="shrink-0 text-[11.5px] h-7 px-2.5 bg-surface-secondary border-border hover:bg-surface-hover"
                >
                  Retry
                </Button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-panel px-4 py-3 sticky bottom-0 z-10 shrink-0">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="space-y-2"
          >
            <div className="relative rounded-md border border-border bg-surface-secondary focus-within:border-accent/80 focus-within:ring-1 focus-within:ring-accent/80 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                rows={2}
                maxLength={4000}
                placeholder="Type your challenge, rehearse a conversation, or request a mindset reframe... (Enter to send, Shift+Enter for new line)"
                aria-label="Coaching message input"
                className="w-full resize-none bg-transparent px-3.5 py-2.5 text-[13.5px] leading-relaxed text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-50"
              />

              <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/40 text-[11px] text-text-muted">
                <span>
                  {input.length > 0 ? `${input.length} / 4,000` : "Enter ↵ to send • Shift+Enter ↵ for newline"}
                </span>

                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  size="sm"
                  className="h-7 px-3 text-[12px] bg-accent hover:bg-accent-hover text-accent-foreground font-medium disabled:opacity-40 gap-1.5"
                  aria-label="Send message to AI Coach"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
