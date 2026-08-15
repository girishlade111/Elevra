import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { connectEmailSchema } from "@/lib/validation/email";
import { ResendEmailAdapter } from "@/lib/email/resend-adapter";
import { GmailSmtpEmailAdapter } from "@/lib/email/gmail-adapter";
import {
  upsertEmailConnection,
  updateLastTested,
} from "@/db/repositories/email-connection.repository";
import { upsertEmailPreference } from "@/db/repositories/email-preference.repository";
import type { ApiResponse } from "@/types/api";

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;

    const body = await req.json();
    const parsed = connectEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid email provider configuration",
            details: parsed.error.flatten(),
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Verify connection before storing credentials
    let verification: { success: boolean; message?: string };
    if (parsed.data.provider === "resend") {
      const adapter = new ResendEmailAdapter(parsed.data.apiKey, parsed.data.fromEmail);
      verification = await adapter.verifyConnection();
    } else {
      const adapter = new GmailSmtpEmailAdapter(parsed.data.email, parsed.data.appPassword);
      verification = await adapter.verifyConnection();
    }

    if (!verification.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "CONNECTION_FAILED",
            message: verification.message || "Failed to verify email provider credentials",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Persist Gmail connection with encrypted App Password
    if (parsed.data.provider === "gmail_smtp") {
      await upsertEmailConnection(userId, {
        email: parsed.data.email ?? "",
        appPassword: parsed.data.appPassword ?? "",
        provider: "gmail",
      });
      await updateLastTested(userId, true);
    }

    // Update email preferences to record which provider is active
    const providerKey = parsed.data.provider === "resend" ? "resend" : "gmail";
    await upsertEmailPreference(userId, {
      provider: providerKey,
      weeklyCheckinsEnabled: true,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          provider: parsed.data.provider,
          status: "connected",
          updatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API POST /api/email/connect error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to connect email provider",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
