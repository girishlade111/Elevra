import type { CoachingIntent, StructuredCoachingResponse } from "@/types/ai";

export interface AIProviderConfig {
  apiKey?: string;
  baseURL: string;
  defaultModel: string;
}

export interface CompletionOptions {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  responseFormatJson?: boolean;
}

export interface ParsedCoachingResult {
  structured: StructuredCoachingResponse;
  rawText: string;
  intent: CoachingIntent;
}
