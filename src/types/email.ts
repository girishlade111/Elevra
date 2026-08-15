export type EmailProviderType = "resend" | "gmail_smtp";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider: EmailProviderType;
  error?: string;
}

export interface EmailProviderConfig {
  type: EmailProviderType;
  resendApiKey?: string;
  resendFromEmail?: string;
  gmailUser?: string;
  gmailAppPassword?: string;
}

export interface EmailLogEntry {
  id: string;
  userId: string;
  provider: EmailProviderType;
  recipientEmail: string;
  templateType: "weekly_checkin" | "test_email" | "coaching_reminder" | "onboarding_welcome";
  status: "sent" | "failed" | "queued";
  errorMessage?: string | null;
  sentAt: string;
}
