import OpenAI from "openai";
import { getServerEnv } from "@/config/env";
import { APP_CONFIG } from "@/config/app";
import type { StructuredCoachingResponse } from "@/types/ai";
import type { CompletionOptions, ParsedCoachingResult } from "./types";
import { INTENT_DETECTION_PROMPT } from "./prompts";

/**
 * NVIDIA NIM AI Client Service
 * Uses OpenAI SDK standard client configured to talk with NVIDIA NIM endpoints.
 */
class NVIDIAAIClient {
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const env = getServerEnv();
      if (!env.NVIDIA_NIM_API_KEY) {
        throw new Error(
          "NVIDIA_NIM_API_KEY is not configured in server environment. Please configure it in .env"
        );
      }
      this.client = new OpenAI({
        apiKey: env.NVIDIA_NIM_API_KEY,
        baseURL: env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1",
      });
    }
    return this.client;
  }

  /**
   * Generates a structured coaching completion from conversation history
   */
  async generateCoachingResponse(
    options: CompletionOptions
  ): Promise<ParsedCoachingResult> {
    const client = this.getClient();
    const model = APP_CONFIG.ai.defaultModel;

    const response = await client.chat.completions.create({
      model,
      messages: options.messages,
      temperature: options.temperature ?? APP_CONFIG.ai.temperature,
      max_tokens: options.maxTokens ?? APP_CONFIG.ai.maxTokens,
      response_format: options.responseFormatJson
        ? { type: "json_object" }
        : undefined,
    });

    const rawText = response.choices[0]?.message?.content || "";
    let structured: StructuredCoachingResponse;

    try {
      structured = JSON.parse(rawText) as StructuredCoachingResponse;
    } catch {
      // Fallback structured wrapper if raw text was not strict JSON
      structured = {
        intent: "general_inquiry",
        coachingMessage: rawText,
        keyInsights: ["Focus on incremental daily experiments."],
        recommendedMicroAction: {
          title: "Reflect on one positive win today",
          description: "Write down 1 specific thing you navigated well.",
          estimatedMinutes: 5,
        },
        followUpPrompt: "How does this perspective feel to you?",
        confidenceIndicator: "building",
      };
    }

    return {
      structured,
      rawText,
      intent: structured.intent || "general_inquiry",
    };
  }

  /**
   * Classifies user message intent separately if needed
   */
  async classifyIntent(userMessage: string): Promise<string> {
    const client = this.getClient();
    const response = await client.chat.completions.create({
      model: APP_CONFIG.ai.defaultModel,
      messages: [
        { role: "system", content: INTENT_DETECTION_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    return response.choices[0]?.message?.content || "general_inquiry";
  }
}

export const aiClient = new NVIDIAAIClient();
