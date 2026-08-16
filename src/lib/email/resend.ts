/**
 * @fileoverview Resend Email Provider implementation.
 * Delivers emails using the Resend Transactional API SDK.
 * @server-only
 */
import { Resend } from "resend";
import { getServerEnv } from "@/config/env";
import { type EmailProvider, type EmailSendOptions, type EmailSendResult, type EmailConnectionTestResult } from "./provider";

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend" as const;
  private client: Resend | null = null;
  private apiKey: string | null = null;
  private fromEmail: string | null = null;

  constructor(options?: { apiKey?: string; fromEmail?: string }) {
    this.apiKey = options?.apiKey || null;
    this.fromEmail = options?.fromEmail || null;
  }

  private getClient(): { client: Resend; from: string } {
    if (!this.client) {
      const env = getServerEnv();
      const key = this.apiKey || env.RESEND_API_KEY;

      if (!key) {
        throw new Error(
          "Resend configuration unavailable. Ensure RESEND_API_KEY is configured in your server environment."
        );
      }

      this.client = new Resend(key);
    }

    const env = getServerEnv();
    const from =
      this.fromEmail ||
      env.RESEND_FROM_EMAIL ||
      "Elevra Confidence Coach <coach@elevra.ai>";

    return { client: this.client, from };
  }

  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const { to, subject, html, text, from: customFrom } = options;

    try {
      const { client, from: defaultFrom } = this.getClient();
      const from = customFrom || defaultFrom;

      const result = await client.emails.send({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, " ").trim(),
      });

      if (result.error) {
        return {
          success: false,
          provider: this.name,
          error: result.error.message || "Failed to send email via Resend.",
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
        provider: this.name,
      };
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Email provider temporarily unavailable.";
      return {
        success: false,
        provider: this.name,
        error: errorMsg,
      };
    }
  }

  async testConnection(): Promise<EmailConnectionTestResult> {
    try {
      this.getClient();
      return {
        success: true,
        provider: this.name,
        message: "Resend API key is configured and ready.",
      };
    } catch (err) {
      return {
        success: false,
        provider: this.name,
        error:
          err instanceof Error
            ? err.message
            : "Resend configuration unavailable.",
      };
    }
  }
}
