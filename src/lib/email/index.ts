import type { EmailPayload, EmailSendResult, EmailProviderType } from "@/types/email";
import type { EmailProviderAdapter } from "./types";
import { ResendEmailAdapter } from "./resend-adapter";
import { GmailSmtpEmailAdapter } from "./gmail-adapter";
import { getServerEnv } from "@/config/env";

export function getEmailProvider(type?: EmailProviderType): EmailProviderAdapter {
  if (type === "gmail_smtp") {
    return new GmailSmtpEmailAdapter();
  }

  if (type === "resend") {
    return new ResendEmailAdapter();
  }

  // Automatic provider selection based on configured environment variables
  const env = getServerEnv();
  if (env.RESEND_API_KEY) {
    return new ResendEmailAdapter();
  }
  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
    return new GmailSmtpEmailAdapter();
  }

  // Default fallback to Resend adapter
  return new ResendEmailAdapter();
}

export async function sendAppEmail(
  payload: EmailPayload,
  preferredProvider?: EmailProviderType
): Promise<EmailSendResult> {
  const provider = getEmailProvider(preferredProvider);
  return provider.sendEmail(payload);
}

export * from "./types";
export * from "./templates";
export * from "./resend-adapter";
export * from "./gmail-adapter";
