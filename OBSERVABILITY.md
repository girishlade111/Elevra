# Observability, Reliability & Error Management Playbook

This document defines the operational architecture, error classifications, request correlation standards, and troubleshooting procedures for the **Elevra AI Confidence Coach** platform.

---

## 1. Canonical Error Model & Status Mappings

Every API response follows a deterministic contract ([`src/lib/errors/app-error.ts`](file:///c:/Users/Girish%20Lade/OneDrive/Desktop/Elevra/src/lib/errors/app-error.ts)). Raw database traces, SQL statements, and provider credentials are never leaked to clients.

| Error Code | HTTP Status | Retryable | User-Facing Summary | Triggers / Conditions |
| :--- | :---: | :---: | :--- | :--- |
| `VALIDATION_ERROR` | `400` | No | "Please check your input values and try again." | Zod validation failure on incoming request body or query params. |
| `AUTH_ERROR` | `401` | No | "Your session has expired or authentication is required." | Missing, invalid, or expired Clerk session token. |
| `FORBIDDEN` | `403` | No | "You do not have permission to access this resource." | Uncompleted onboarding or cross-tenant resource modification attempt. |
| `NOT_FOUND` | `404` | No | "The requested item could not be found." | Non-existent conversation, check-in, or profile resource ID. |
| `RATE_LIMITED` | `429` | Yes | "Too many requests. Please pause a moment before trying again." | Sliding window rate limit exceeded on chat, email, or export routes. |
| `AI_PROVIDER_ERROR` | `502 / 504` | Yes | "The coaching engine encountered a temporary delay. Please try again." | NVIDIA NIM upstream 5xx error, timeout, or rate limiting. |
| `EMAIL_PROVIDER_ERROR` | `400 / 502` | No | "Unable to dispatch email. Please verify your connection settings." | Invalid Gmail App Password or unverified Resend API key. |
| `DATABASE_ERROR` | `500` | Yes | "A temporary data storage disruption occurred. Please try again." | Transient Neon Postgres connection reset or database failure. |
| `INTERNAL_ERROR` | `500` | Yes | "An unexpected error occurred. Please try again shortly." | Uncaught server exceptions. |

### 1.1 API Response Schema
```json
{
  "success": false,
  "error": {
    "code": "AI_PROVIDER_ERROR",
    "message": "The coaching engine encountered a temporary delay. Please try your message again.",
    "details": null,
    "requestId": "req_8jF2k1mP9qLx"
  },
  "timestamp": "2026-08-16T11:45:00.000Z"
}
```

---

## 2. Structured Logging & Request Correlation

### 2.1 Uniform JSON Log Format
All significant server operations are logged via [`src/lib/observability/logger.ts`](file:///c:/Users/Girish%20Lade/OneDrive/Desktop/Elevra/src/lib/observability/logger.ts) using uniform JSON events:

```json
{
  "timestamp": "2026-08-16T11:45:00.000Z",
  "level": "info",
  "requestId": "req_8jF2k1mP9qLx",
  "userId": "user_2tXYZ12345",
  "action": "chat.message_sent",
  "provider": "nvidia_nim",
  "status": "success",
  "durationMs": 420,
  "meta": {
    "intent": "salary",
    "model": "meta/llama-3.3-70b-instruct"
  }
}
```

### 2.2 Sensitive Field Redaction Policy
The logger automatically intercepts and redacts any fields matching sensitive keys:
`password`, `appPassword`, `app_password`, `secret`, `cron_secret`, `apiKey`, `token`, `authorization`, `cookie`, `session`.

---

## 3. Resilience & Retry Strategy

### 3.1 Idempotent Read Retries (`withSafeRetry`)
- Transient errors on read operations (e.g., Neon connection cold starts, `ECONNRESET`, `ETIMEDOUT`) are retried up to 3 times with exponential backoff and jitter ([`src/lib/observability/retry.ts`](file:///c:/Users/Girish%20Lade/OneDrive/Desktop/Elevra/src/lib/observability/retry.ts)).
- **Safety Rule**: Non-idempotent state mutations (e.g., deducting tokens, writing messages, dispatching transactional emails) are never retried blindly to prevent duplicate execution.

### 3.2 Chat Failure Resilience
- If an AI inference request fails:
  1. The user's input is preserved in UI state.
  2. A localized error banner is rendered with a dedicated **Retry** button.
  3. Re-sending reuses the client message ID to prevent duplicate database rows.

### 3.3 Batch Cron Resilience
- `runWeeklyCheckinCron` wraps each user in an isolated `try/catch` block.
- If user A has an expired Gmail App Password, user A is recorded as `status: failed` while batch execution immediately continues to user B and C.

---

## 4. Troubleshooting Runbooks

### 4.1 NVIDIA NIM Troubleshooting
- **Symptom**: `AI_CONFIG_ERROR` / `500` status.
  - **Resolution**: Verify `NVIDIA_API_KEY` is present in server environment variables.
- **Symptom**: `AIRateLimitError` / `429` status.
  - **Resolution**: Upstream quota reached. Elevra automatically informs the client with retryable backoff guidance.
- **Symptom**: Malformed JSON response from LLM.
  - **Resolution**: `parseStructuredOutput` strips markdown codeblocks. If still invalid, `createFallbackCheckin` provides grounded personalized guidance based on user goals.

### 4.2 Email Provider Troubleshooting
- **Resend**:
  - Check `RESEND_API_KEY` and confirm sending from configured `RESEND_FROM_EMAIL` (default: `onboarding@resend.dev` or verified domain).
- **Gmail SMTP**:
  - Verify user is using a **16-character Google App Password** (not personal Google password).
  - Verify 2-Step Verification is active on the user's Google account.
  - Use `/api/email/test` to inspect connection handshake logs (`maskEmail` ensures safety).

### 4.3 Vercel Cron Troubleshooting
- **Symptom**: `401 Unauthorized` on `/api/cron/weekly-checkin`.
  - **Resolution**: Ensure `CRON_SECRET` is defined in Vercel Project Settings and matching `Authorization: Bearer <CRON_SECRET>` header is sent.
- **Symptom**: Check-ins marked `status: skipped`.
  - **Resolution**: User received a check-in within the last 6 days (`hasCheckinInWindow` idempotency guard).
