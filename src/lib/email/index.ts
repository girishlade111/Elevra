/**
 * @fileoverview Email subsystem entrypoint.
 * Re-exports providers, service, templates, and encryption utilities.
 * @server-only
 */
import type { EmailSendOptions, EmailSendResult, EmailProviderType } from "./provider";
import { emailService } from "./service";

export async function sendAppEmail(
  options: EmailSendOptions,
  preferredProvider?: EmailProviderType
): Promise<EmailSendResult> {
  const { provider } = await emailService.resolveProvider("", preferredProvider);
  return provider.send(options);
}

export * from "./provider";
export * from "./resend";
export * from "./gmail";
export * from "./nodemailer";
export * from "./encryption";
export * from "./service";
export * from "./templates";
