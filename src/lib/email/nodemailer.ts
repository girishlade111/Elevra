/**
 * @fileoverview Nodemailer Gmail SMTP connection helper.
 * Manages SMTP transport instantiation, connection verification,
 * and sanitized error mapping without leaking passwords or sensitive tokens.
 * @server-only
 */
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Creates an authenticated Nodemailer transporter for Gmail SMTP.
 * Strips whitespace from Google App Passwords automatically.
 */
export function createGmailTransporter(user: string, rawPass: string): Transporter {
  const cleanPass = rawPass.replace(/\s+/g, "").trim();

  return nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: user.trim(),
      pass: cleanPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

/**
 * Masks an email address for safe log output (e.g. "alex.rivera@gmail.com" -> "al***@gmail.com")
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***";
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

/**
 * Maps raw SMTP errors to human-readable user-friendly messages.
 * Prevents raw authentication stack traces from reaching the client.
 */
export function mapSmtpError(error: unknown): string {
  if (!error) return "Failed to connect to email provider.";

  const message = error instanceof Error ? error.message : String(error);
  const code = (error as { code?: string })?.code;
  const responseCode = (error as { responseCode?: number })?.responseCode;

  if (
    responseCode === 535 ||
    message.includes("BadCredentials") ||
    message.includes("Invalid second-factor") ||
    message.includes("Username and Password not accepted") ||
    code === "EAUTH"
  ) {
    return "Gmail authentication failed. Please verify your Gmail address and 16-character App Password (ensure 2-Step Verification is enabled).";
  }

  if (code === "ETIMEDOUT" || code === "ESOCKETTIMEDOUT" || message.includes("timeout")) {
    return "Connection to Gmail SMTP timed out. Please check your network and try again.";
  }

  if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
    return "Could not reach Gmail SMTP servers. Please check your internet connection.";
  }

  return "Email provider temporarily unavailable. Please verify your credentials and try again.";
}

/**
 * Verifies that a Gmail SMTP transporter can authenticate with Google.
 */
export async function verifySmtpConnection(
  transporter: Transporter
): Promise<{ success: boolean; error?: string }> {
  try {
    await transporter.verify();
    return { success: true };
  } catch (err) {
    const safeError = mapSmtpError(err);
    return { success: false, error: safeError };
  }
}
