import OpenAI from "openai";
import { getServerEnv } from "@/config/env";
import {
  type AIProvider,
  type CoachingGenerationParams,
  type CoachingGenerationResult,
  type AITokenUsage,
  getEffectiveRecentMessages,
} from "./provider";
import {
  type CoachingIntent,
  coachingIntentEnum,
  validateCoachingResponse,
  extractJsonFromModelOutput,
} from "./schemas";
import { buildCoachingSystemPrompt } from "./prompts";
import { detectIntentLocal, FALLBACK_INTENT_SYSTEM_PROMPT } from "./intent";
import {
  AIConfigurationError,
  AIValidationError,
  mapProviderError,
} from "./errors";

// ---------------------------------------------------------------------------
// Nvidia NIM Provider Implementation
// ---------------------------------------------------------------------------

export class NvidiaNIMProvider implements AIProvider {
  readonly name = "nvidia-nim";
  private client: OpenAI | null = null;

  constructor(
    private options?: {
      apiKey?: string;
      baseURL?: string;
      model?: string;
      timeoutMs?: number;
    }
  ) {}

  /**
   * Lazily initializes and caches the OpenAI-compatible client for NVIDIA NIM
   */
  private getClient(): OpenAI {
    if (this.client) {
      return this.client;
    }

    const env = getServerEnv();
    const apiKey = this.options?.apiKey || env.NVIDIA_API_KEY || env.NVIDIA_NIM_API_KEY;
    const baseURL = this.options?.baseURL || env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1";

    if (!apiKey) {
      throw new AIConfigurationError(
        "NVIDIA_API_KEY is missing in server environment. Configure NVIDIA_API_KEY in .env"
      );
    }

    this.client = new OpenAI({
      apiKey,
      baseURL,
      timeout: this.options?.timeoutMs ?? 25000,
      maxRetries: 0, // We control retries explicitly in the provider
    });

    return this.client;
  }

  private getModel(): string {
    const env = getServerEnv();
    return this.options?.model || env.NVIDIA_NIM_MODEL || "meta/llama-3.1-70b-instruct";
  }

  /**
   * Classifies message intent via NVIDIA NIM as a fallback when local scoring is uncertain
   */
  async classifyIntent(message: string): Promise<CoachingIntent> {
    const client = this.getClient();
    const model = this.getModel();

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: FALLBACK_INTENT_SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        temperature: 0.1,
        max_tokens: 60,
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0]?.message?.content || "";
      const json = extractJsonFromModelOutput(raw) as { intent?: string };
      const parsedIntent = coachingIntentEnum.safeParse(json?.intent?.toLowerCase());

      return parsedIntent.success ? parsedIntent.data : "general";
    } catch (err) {
      console.warn("[NvidiaNIM] Fallback intent classification failed, defaulting to general:", err);
      return "general";
    }
  }

  /**
   * Primary coaching generation method with retry, timeout, personalization, and strict schema validation
   */
  async generateCoaching(params: CoachingGenerationParams): Promise<CoachingGenerationResult> {
    const { message, context, overrideIntent, temperature = 0.4, maxTokens = 800 } = params;
    const startTime = Date.now();
    const model = this.getModel();

    // 1. Determine Intent (Local fast-path + NIM fallback)
    let intent: CoachingIntent;
    if (overrideIntent) {
      intent = overrideIntent;
    } else {
      const localDetection = detectIntentLocal(message);
      if (localDetection.isConfident && localDetection.intent !== "general") {
        intent = localDetection.intent;
      } else {
        // Fallback to NIM intent classifier
        intent = await this.classifyIntent(message);
      }
    }

    // 2. Build Personalized System Prompt
    const systemPrompt = buildCoachingSystemPrompt({
      userName: context.userName,
      careerStage: context.careerStage,
      biggestChallenge: context.biggestChallenge,
      monthlyGoal: context.monthlyGoal,
      detectedIntent: intent,
      memorySummary: context.longTermMemory?.summaryText,
    });

    // 3. Assemble Bounded History (Last 5 exchanges = 10 messages max)
    const boundedHistory = getEffectiveRecentMessages(context.recentMessages || [], 5);

    const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...boundedHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    // 4. Execute with Single Retry on Transient Failure
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const client = this.getClient();

        const response = await client.chat.completions.create({
          model,
          messages: apiMessages,
          temperature,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
        });

        const rawOutput = response.choices[0]?.message?.content || "";
        if (!rawOutput) {
          throw new AIValidationError("NVIDIA NIM returned an empty response content.");
        }

        // 5. Strict Schema Validation
        const validatedResponse = validateCoachingResponse(rawOutput);

        // Ensure intent matches detected intent or response contract
        if (!validatedResponse.intent_detected) {
          validatedResponse.intent_detected = intent;
        }

        // 6. Token Usage Extraction (Safe null handling)
        const usage: AITokenUsage = {
          model,
          inputTokens: response.usage?.prompt_tokens ?? null,
          outputTokens: response.usage?.completion_tokens ?? null,
          totalTokens: response.usage?.total_tokens ?? null,
        };

        const latencyMs = Date.now() - startTime;

        return {
          response: validatedResponse,
          rawOutput,
          usage,
          intent: validatedResponse.intent_detected,
          latencyMs,
        };
      } catch (err) {
        lastError = err;
        const mapped = mapProviderError(err);

        console.error(`[NvidiaNIM] Generation attempt ${attempt} failed:`, {
          code: mapped.code,
          message: mapped.message,
          isRetryable: mapped.isRetryable,
        });

        // Only retry if error is retryable and we have an attempt remaining
        if (attempt === 1 && mapped.isRetryable) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        throw mapped;
      }
    }

    throw mapProviderError(lastError);
  }
}

// ---------------------------------------------------------------------------
// Singleton Instance Export
// ---------------------------------------------------------------------------

export const nvidiaNIMProvider = new NvidiaNIMProvider();
export default nvidiaNIMProvider;
