"use client";

import * as React from "react";
import { Send, Sparkles, CheckCircle2, ShieldAlert, ArrowUpRight } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { StructuredCoachingResponse } from "@/types/ai";

interface MessageItem {
  id: string;
  sender: "user" | "assistant";
  content: string;
  structured?: StructuredCoachingResponse;
  timestamp: string;
}

export default function CoachWorkspacePage() {
  const [messages, setMessages] = React.useState<MessageItem[]>([
    {
      id: "init-1",
      sender: "assistant",
      content:
        "Welcome to your coaching space. What specific situation, conversation, or mindset challenge would you like to work through right now?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    const newMsg: MessageItem = {
      id: `usr_${Date.now()}`,
      sender: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: "conv_active",
          message: userText,
          includeIntentAnalysis: true,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        const assistantMsg: MessageItem = {
          id: `ast_${Date.now()}`,
          sender: "assistant",
          content: json.data.structured?.coachingMessage || json.data.rawText,
          structured: json.data.structured,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg: MessageItem = {
          id: `ast_${Date.now()}`,
          sender: "assistant",
          content:
            "I'm ready to assist. Please verify your NVIDIA NIM API key in your server environment to stream live completions.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const fallbackMsg: MessageItem = {
        id: `ast_${Date.now()}`,
        sender: "assistant",
        content: "Let's focus on one actionable step: acknowledge what you can control right now.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <AppHeader
        title="Live Coaching Workspace"
        description="Structured cognitive behavioral guidance powered by NVIDIA NIM."
      />

      <div className="flex-1 overflow-y-auto py-6">
        <Container size="default" className="space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-2xl rounded-[6px] border p-4 text-[13.5px] leading-relaxed ${
                  m.sender === "user"
                    ? "bg-surface-secondary border-border text-text-primary"
                    : "bg-panel border-border text-text-primary"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-border/60 text-[11.5px] text-text-muted">
                  <span className="font-medium text-text-secondary">
                    {m.sender === "user" ? "You" : "AI Confidence Coach"}
                  </span>
                  <span>{m.timestamp}</span>
                </div>

                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Structured coaching insights */}
                {m.structured && (
                  <div className="mt-4 pt-3 border-t border-border space-y-3">
                    {m.structured.intent && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11.5px] text-text-muted">Detected Intent:</span>
                        <Badge variant="accent">
                          {m.structured.intent.replace("_", " ")}
                        </Badge>
                      </div>
                    )}

                    {m.structured.keyInsights && m.structured.keyInsights.length > 0 && (
                      <div className="p-3 bg-surface-secondary rounded-[4px] border border-border">
                        <div className="text-[12px] font-medium text-text-secondary mb-1">
                          Key Cognitive Insights
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-[12.5px] text-text-primary">
                          {m.structured.keyInsights.map((insight, idx) => (
                            <li key={idx}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {m.structured.recommendedMicroAction && (
                      <div className="p-3 bg-accent/5 border border-accent/30 rounded-[4px]">
                        <div className="flex items-center justify-between text-[12px] font-semibold text-accent mb-1">
                          <span>Micro-Action Experiment</span>
                          <span className="text-[11px] font-normal text-text-muted">
                            ~{m.structured.recommendedMicroAction.estimatedMinutes} mins
                          </span>
                        </div>
                        <div className="text-[13px] font-medium text-text-primary">
                          {m.structured.recommendedMicroAction.title}
                        </div>
                        <div className="text-[12.5px] text-text-secondary mt-0.5">
                          {m.structured.recommendedMicroAction.description}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </Container>
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-panel p-4 sticky bottom-0">
        <Container size="default">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              placeholder="Type your challenge, rehearse a conversation, or request a mindset reframe..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()} size="sm" className="px-4">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Container>
      </div>
    </div>
  );
}
