import type { StructuredCoachingResponse } from "./ai";

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  lastIntent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: "user" | "assistant" | "system";
  content: string;
  structuredData?: StructuredCoachingResponse | null;
  createdAt: string;
}

export interface WeeklyCheckinRecord {
  id: string;
  userId: string;
  weekNumber: number;
  year: number;
  status: "scheduled" | "generated" | "sent" | "failed";
  emailSubject: string;
  summaryContent: string;
  actionItems: string[];
  sentAt?: string | null;
  error?: string | null;
  createdAt: string;
}
