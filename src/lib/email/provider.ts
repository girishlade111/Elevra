/**
 * @fileoverview Abstract Email Provider Interface & Types.
 * All concrete providers (Resend, Gmail SMTP) adhere strictly to this contract.
 * @server-only
 */

export type EmailProviderType = "resend" | "gmail";

export interface EmailSendOptions {
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

export interface EmailConnectionTestResult {
  success: boolean;
  provider: EmailProviderType;
  message?: string;
  error?: string;
}

export interface EmailProvider {
  readonly name: EmailProviderType;
  send(options: EmailSendOptions): Promise<EmailSendResult>;
  testConnection(): Promise<EmailConnectionTestResult>;
}
