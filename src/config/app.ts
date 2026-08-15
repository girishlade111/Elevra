/**
 * Application Metadata & Global App Settings
 */

export const APP_CONFIG = {
  name: "AI Confidence Coach",
  shortName: "ConfidenceCoach",
  description:
    "Production-grade personalized AI coaching system for building real-world confidence, tracking growth, and automated weekly check-ins.",
  version: "1.0.0",
  author: "Elevra Architecture",
  email: {
    fromDefault: "coach@aiconfidencecoach.com",
    supportEmail: "support@aiconfidencecoach.com",
  },
  ai: {
    defaultModel: "meta/llama-3.1-70b-instruct",
    defaultProvider: "nvidia-nim",
    temperature: 0.7,
    maxTokens: 1024,
  },
  cron: {
    weeklyCheckinDay: 1, // Monday
    weeklyCheckinHourUtc: 9,
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
