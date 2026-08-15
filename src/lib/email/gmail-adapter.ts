import nodemailer from "nodemailer";
import { getServerEnv } from "@/config/env";
import type { EmailPayload, EmailSendResult } from "@/types/email";
import type { EmailProviderAdapter } from "./types";

export class GmailSmtpEmailAdapter implements EmailProviderAdapter {
  readonly providerType = "gmail_smtp";
  private user?: string;
  private pass?: string;

  constructor(user?: string, pass?: string) {
    this.user = user;
    this.pass = pass;
  }

  private createTransporter() {
    const env = getServerEnv();
    const user = this.user || env.GMAIL_USER;
    const pass = this.pass || env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD are required for Gmail SMTP delivery.");
    }

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });
  }

  async sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
    try {
      const transporter = this.createTransporter();
      const env = getServerEnv();
      const from = payload.from || this.user || env.GMAIL_USER;

      const info = await transporter.sendMail({
        from: `"AI Confidence Coach" <${from}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: this.providerType,
      };
    } catch (err) {
      return {
        success: false,
        provider: this.providerType,
        error: err instanceof Error ? err.message : "Failed to send email via Gmail SMTP",
      };
    }
  }

  async verifyConnection(): Promise<{ success: boolean; message?: string }> {
    try {
      const transporter = this.createTransporter();
      await transporter.verify();
      return { success: true, message: "Gmail SMTP connected successfully" };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to verify Gmail SMTP connection",
      };
    }
  }
}
