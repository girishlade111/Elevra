import { z } from "zod";

/**
 * Server Environment Variables Schema
 * Never exposed to client-side bundles.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required for authentication"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string").optional(),
  ENCRYPTION_KEY: z
    .string()
    .length(64, "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
    .regex(/^[0-9a-f]{64}$/i, "ENCRYPTION_KEY must be a lowercase hex string")
    .optional(),
  NVIDIA_NIM_API_KEY: z.string().min(1, "NVIDIA_NIM_API_KEY is required for coaching intelligence").optional(),
  NVIDIA_NIM_BASE_URL: z.string().url().default("https://integrate.api.nvidia.com/v1"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  GMAIL_USER: z.string().email().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  CRON_SECRET: z.string().min(8, "CRON_SECRET must be at least 8 characters for endpoint security").optional(),
});

/**
 * Public Client Environment Variables Schema
 * Safely accessible in browser client bundles.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default("/app"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default("/app/onboarding"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Client Environment validation (safe for browser and server)
 */
export const clientEnv: ClientEnv = (() => {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k",
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in",
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up",
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:
      process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "/app",
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:
      process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "/app/onboarding",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  });

  if (!parsed.success) {
    console.error("❌ Invalid client environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid client environment variables.");
  }

  return parsed.data;
})();

/**
 * Server Environment accessor (only invoked on server runtime)
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("Server environment variables cannot be accessed on the client side.");
  }

  const parsed = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "sk_test_placeholder_key_for_setup",
    DATABASE_URL: process.env.DATABASE_URL,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    NVIDIA_NIM_API_KEY: process.env.NVIDIA_NIM_API_KEY,
    NVIDIA_NIM_BASE_URL: process.env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1",
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
    CRON_SECRET: process.env.CRON_SECRET,
  });

  if (!parsed.success) {
    console.error("❌ Invalid server environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment variables.");
  }

  return parsed.data;
}
