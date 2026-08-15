import { Resend } from "resend";
import { getServerEnv } from "@/config/env";
import { APP_CONFIG } from "@/config/app";
import type { EmailPayload, EmailSendResult } from "@/types/email";
import type { EmailProviderAdapter } from "./types";

export class ResendEmailAdapter implements EmailProviderAdapter {
  readonly providerType = "resend";
  private resend: Resend | null = null;
  private apiKey: string | null = null;
  private fromEmail: string;

  constructor(apiKey?: string, fromEmail?: string) {
    this.apiKey = apiKey || null;
    this.fromEmail = fromEmail || APP_CONFIG.email.fromDefault;
  }

  private getClient(): Resend {
    if (!this.resend) {
      const key = this.apiKey || getServerEnv().RESEND_API_KEY;
      if (!key) {
        throw new Error("RESEND_API_KEY is not configured.");
      }
      this.resend = new Resend(key);
    }
    return this.resend;
  }

  async sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
    try {
      const client = this.getClient();
      const from = payload.from || this.fromEmail || getServerEnv().RESEND_FROM_EMAIL || APP_CONFIG.email.fromDefault;

      const result = await client.emails.send({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      if (result.error) {
        return {
          success: false,
          provider: this.providerType,
          error: result.error.message,
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
        provider: this.providerType,
      };
    } catch (err) {
      return {
        success: false,
        provider: this.providerType,
        error: err instanceof Error ? err.message : "Unknown Resend error",
      };
    }
  }

  async verifyConnection(): Promise<{ success: boolean; message?: string }> {
    try {
      this.getClient();
      return { success: true, message: "Resend adapter ready" };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Resend configuration invalid",
      };
    }
  }
}
