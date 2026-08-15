import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { testEmailSchema } from "@/lib/validation/email";
import { sendAppEmail } from "@/lib/email";
import { renderTestEmailHtml } from "@/lib/email/templates";
import type { ApiResponse } from "@/types/api";
import type { EmailSendResult } from "@/types/email";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "User session required" },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = testEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid email payload",
            details: parsed.error.flatten(),
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { recipientEmail, provider } = parsed.data;

    const result: EmailSendResult = await sendAppEmail(
      {
        to: recipientEmail,
        subject: "AI Confidence Coach - Email Integration Test",
        html: renderTestEmailHtml(session.name || "Confidence Coach Member"),
      },
      provider
    );

    return NextResponse.json<ApiResponse<EmailSendResult>>(
      {
        success: result.success,
        data: result,
        timestamp: new Date().toISOString(),
      },
      { status: result.success ? 200 : 400 }
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
