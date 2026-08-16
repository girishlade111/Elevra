import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { connectEmailSchema } from "@/lib/validation/email";
import { emailService } from "@/lib/email/service";
import {
  upsertEmailConnection,
  updateLastTested,
} from "@/db/repositories/email-connection.repository";
import { upsertEmailPreference } from "@/db/repositories/email-preference.repository";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;

    const body = await req.json().catch(() => null);
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

    if (parsed.data.provider === "gmail") {
      const { email, appPassword } = parsed.data;

      // 1. Verify Gmail SMTP credentials before persisting to database
      const testResult = await emailService.testConnection(userId, "gmail", {
        email,
        appPassword,
      });

      if (!testResult.success) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              code: "AUTHENTICATION_FAILED",
              message:
                testResult.error ||
                "Gmail authentication failed. Please verify your Gmail address and 16-character App Password.",
            },
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      // 2. Encrypt App Password and store safely (Never expose raw app password)
      const savedConnection = await upsertEmailConnection(userId, {
        email,
        appPassword,
        provider: "gmail",
      });

      await updateLastTested(userId, true);

      // 3. Update user preferences to use Gmail
      await upsertEmailPreference(userId, {
        provider: "gmail",
        weeklyCheckinsEnabled: true,
      });

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: {
            provider: "gmail",
            email: savedConnection.email,
            isConnected: savedConnection.isConnected,
            lastTestedAt: savedConnection.lastTestedAt,
            message: "Gmail SMTP connected and verified successfully.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // Resend Provider Selection
    const testResult = await emailService.testConnection(userId, "resend");
    if (!testResult.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "CONFIG_UNAVAILABLE",
            message: testResult.error || "Resend configuration is not available on the server.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    await upsertEmailPreference(userId, {
      provider: "resend",
      weeklyCheckinsEnabled: true,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          provider: "resend",
          message: "Resend selected as active delivery provider.",
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
