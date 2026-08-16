import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { testEmailSchema } from "@/lib/validation/email";
import { emailService } from "@/lib/email/service";
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
    const parsed = testEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid test email payload",
            details: parsed.error.flatten(),
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { recipientEmail, provider } = parsed.data;

    // Send verified test email via EmailService
    const result = await emailService.sendTestEmail(userId, recipientEmail, provider);

    if (!result.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "EMAIL_SEND_FAILED",
            message: result.error || "Failed to dispatch test email. Please check your credentials.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          messageId: result.messageId,
          provider: result.provider,
          dispatchedTo: recipientEmail,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API POST /api/email/test error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to execute email test",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
