/**
 * @fileoverview Gmail SMTP Email Provider implementation.
 * Delivers transactional emails and weekly digests using user-provided
 * Gmail credentials via Nodemailer over SSL.
 * @server-only
 */
import { type EmailProvider, type EmailSendOptions, type EmailSendResult, type EmailConnectionTestResult } from "./provider";
import { createGmailTransporter, verifySmtpConnection, mapSmtpError, maskEmail } from "./nodemailer";
import type { Transporter } from "nodemailer";

export class GmailEmailProvider implements EmailProvider {
  readonly name = "gmail" as const;

  constructor(
    private credentials: {
      user: string;
      pass: string;
    },
    private transporterFactory?: (user: string, pass: string) => Transporter
  ) {}

  private getTransporter(): Transporter {
    if (this.transporterFactory) {
      return this.transporterFactory(this.credentials.user, this.credentials.pass);
    }
    return createGmailTransporter(this.credentials.user, this.credentials.pass);
  }

  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const { to, subject, html, text, from } = options;
    const senderAddress = from || this.credentials.user;

    try {
      const transporter = this.getTransporter();

      const info = await transporter.sendMail({
        from: `"Elevra Coach" <${senderAddress}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, " ").trim(),
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: this.name,
      };
    } catch (err) {
      const userMessage = mapSmtpError(err);
      console.error(`[GmailProvider] Send failure to ${maskEmail(to)}:`, userMessage);

      return {
        success: false,
        provider: this.name,
        error: userMessage,
      };
    }
  }

  async testConnection(): Promise<EmailConnectionTestResult> {
    try {
      const transporter = createGmailTransporter(this.credentials.user, this.credentials.pass);
      const verification = await verifySmtpConnection(transporter);

      if (!verification.success) {
        return {
          success: false,
          provider: this.name,
          error: verification.error || "Gmail authentication failed.",
        };
      }

      return {
        success: true,
        provider: this.name,
        message: `Successfully connected to Gmail SMTP (${maskEmail(this.credentials.user)}).`,
      };
    } catch (err) {
      return {
        success: false,
        provider: this.name,
        error: mapSmtpError(err),
      };
    }
  }
}
