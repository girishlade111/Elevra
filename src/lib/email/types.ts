import type { EmailPayload, EmailSendResult, EmailProviderType } from "@/types/email";

export interface EmailProviderAdapter {
  readonly providerType: EmailProviderType;
  sendEmail(payload: EmailPayload): Promise<EmailSendResult>;
  verifyConnection(): Promise<{ success: boolean; message?: string }>;
}
