import type { AICoachingResponse, CoachingIntent } from "./schemas";

// ---------------------------------------------------------------------------
// Memory Abstraction Interfaces
// ---------------------------------------------------------------------------

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Long-term memory summary interface for future compressed memory consolidation.
 */
export interface MemorySummaryContext {
  summaryText: string;
  updatedAt: Date | string;
  keyThemes?: string[];
}

/**
 * Personalization & session context provided for every coaching generation.
 */
export interface CoachingContext {
  userName?: string;
  careerStage?: string;
  biggestChallenge?: string;
  monthlyGoal?: string;
  /**
   * Recent user and assistant message exchanges.
   * Capped to the last 5 meaningful exchanges (10 messages max).
   */
  recentMessages?: AIMessage[];
  /**
   * Long-term memory summary abstraction (MVP supports summary string injection).
   */
  longTermMemory?: MemorySummaryContext | null;
}

// ---------------------------------------------------------------------------
// Generation Contracts
// ---------------------------------------------------------------------------

export interface CoachingGenerationParams {
  message: string;
  context: CoachingContext;
  overrideIntent?: CoachingIntent;
  temperature?: number;
  maxTokens?: number;
}

export interface AITokenUsage {
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

export interface CoachingGenerationResult {
  response: AICoachingResponse;
  rawOutput: string;
  usage: AITokenUsage;
  intent: CoachingIntent;
  latencyMs: number;
}

// ---------------------------------------------------------------------------
// Abstract AI Provider Interface
// ---------------------------------------------------------------------------

export interface AIProvider {
  readonly name: string;
  generateCoaching(params: CoachingGenerationParams): Promise<CoachingGenerationResult>;
  classifyIntent(message: string): Promise<CoachingIntent>;
}

// ---------------------------------------------------------------------------
// Memory Helper Utilities
// ---------------------------------------------------------------------------

/**
 * Extracts and bounds conversation history to the last 5 meaningful user/assistant
 * exchanges (maximum 10 messages) to match the original workflow memory window.
 */
export function getEffectiveRecentMessages(
  history: AIMessage[] = [],
  maxExchanges = 5
): AIMessage[] {
  const maxMessages = maxExchanges * 2;
  if (!history || history.length === 0) return [];

  // Filter out any system messages from conversation turns
  const chatTurns = history.filter((m) => m.role === "user" || m.role === "assistant");

  // Take the most recent slice
  return chatTurns.slice(-maxMessages);
}
