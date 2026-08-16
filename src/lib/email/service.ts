/**
 * @fileoverview Email Service orchestrator.
 * Dynamically resolves user email providers (Resend or Gmail SMTP with decrypted credentials),
 * coordinates test dispatches, automated weekly digests, and database audit logging.
 * @server-only
 */
import { type EmailProvider, type EmailProviderType, type EmailSendResult, type EmailConnectionTestResult } from "./provider";
import { ResendEmailProvider } from "./resend";
import { GmailEmailProvider } from "./gmail";
import {
  getEmailConnectionWithCredentials,
  updateLastTested,
} from "@/db/repositories/email-connection.repository";
import { getEmailPreference } from "@/db/repositories/email-preference.repository";
import { createCheckin, updateCheckinStatus } from "@/db/repositories/weekly-checkin.repository";
import { getProfile } from "@/db/repositories/profile.repository";
import {
  renderTestEmailHtml,
  renderTestEmailText,
  renderWeeklyCheckinHtml,
  renderWeeklyCheckinText,
  type WeeklyCheckinEmailData,
} from "./templates";

export class EmailService {
  /**
   * Resolves the active EmailProvider instance for a specific user based on database preferences.
   */
  async resolveProvider(
    clerkUserId: string,
    providerOverride?: EmailProviderType
  ): Promise<{ provider: EmailProvider; resolvedType: EmailProviderType }> {
    const pref = await getEmailPreference(clerkUserId);
    const targetType: EmailProviderType =
      providerOverride || (pref?.provider === "gmail" ? "gmail" : "resend");

    if (targetType === "gmail") {
      const conn = await getEmailConnectionWithCredentials(clerkUserId);
      if (conn && conn.appPassword && conn.email) {
        return {
          provider: new GmailEmailProvider({ user: conn.email, pass: conn.appPassword }),
          resolvedType: "gmail",
        };
      }
    }

    return {
      provider: new ResendEmailProvider(),
      resolvedType: "resend",
    };
  }

  /**
   * Tests connection connectivity for a given provider or pending credentials.
   */
  async testConnection(
    clerkUserId: string,
    providerType: EmailProviderType,
    tempCredentials?: { email: string; appPassword: string }
  ): Promise<EmailConnectionTestResult> {
    if (providerType === "gmail") {
      if (tempCredentials) {
        const testProvider = new GmailEmailProvider({
          user: tempCredentials.email,
          pass: tempCredentials.appPassword,
        });
        return testProvider.testConnection();
      }

      const conn = await getEmailConnectionWithCredentials(clerkUserId);
      if (!conn || !conn.appPassword) {
        return {
          success: false,
          provider: "gmail",
          error: "No Gmail credentials connected for this account.",
        };
      }

      const testProvider = new GmailEmailProvider({
        user: conn.email,
        pass: conn.appPassword,
      });

      const result = await testProvider.testConnection();
      await updateLastTested(clerkUserId, result.success);
      return result;
    }

    // Resend
    const resendProvider = new ResendEmailProvider();
    return resendProvider.testConnection();
  }

  /**
   * Dispatches a real test email to verify end-to-end delivery.
   */
  async sendTestEmail(
    clerkUserId: string,
    recipientEmail: string,
    providerOverride?: EmailProviderType
  ): Promise<EmailSendResult> {
    const profile = await getProfile(clerkUserId);
    const userName = profile?.name?.split(" ")[0] || "Client";

    const { provider, resolvedType } = await this.resolveProvider(clerkUserId, providerOverride);

    const html = renderTestEmailHtml({
      userName,
      provider: resolvedType,
    });
    const text = renderTestEmailText({
      userName,
      provider: resolvedType,
    });

    const result = await provider.send({
      to: recipientEmail,
      subject: "Elevra • Email Integration Test",
      html,
      text,
    });

    return result;
  }

  /**
   * Dispatches an automated weekly executive check-in digest and records the audit log in Neon DB.
   */
  async sendWeeklyDigest(
    clerkUserId: string,
    recipientEmail: string,
    digestData: WeeklyCheckinEmailData,
    providerOverride?: EmailProviderType
  ): Promise<EmailSendResult> {
    const { provider, resolvedType } = await this.resolveProvider(clerkUserId, providerOverride);

    const subject = digestData.subject;
    const html = renderWeeklyCheckinHtml(digestData);
    const text = renderWeeklyCheckinText(digestData);

    // 1. Create pending audit record
    const checkinRecord = await createCheckin({
      clerkUserId,
      provider: resolvedType,
      recipientEmail,
      subject,
      content: text,
    });

    // 2. Dispatch email
    const result = await provider.send({
      to: recipientEmail,
      subject,
      html,
      text,
    });

    // 3. Update audit status
    await updateCheckinStatus(
      checkinRecord.id,
      result.success ? "sent" : "failed",
      result.messageId || null,
      result.error || null
    );

    return result;
  }
}

export const emailService = new EmailService();
