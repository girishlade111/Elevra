import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { connectEmailSchema } from "@/lib/validation/email";
import { ResendEmailAdapter } from "@/lib/email/resend-adapter";
import { GmailSmtpEmailAdapter } from "@/lib/email/gmail-adapter";
import type { ApiResponse } from "@/types/api";

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

    // Verify connection
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
