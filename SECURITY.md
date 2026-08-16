# Security Architecture & Production Hardening Policy

This document details the security posture, authentication protocols, credential encryption standards, and threat mitigation models implemented across the **Elevra AI Confidence Coach** platform.

---

## 1. Authentication & Authorization Strategy

### 1.1 Multi-Layered Authentication Gatekeeping
- **Edge Middleware (`middleware.ts`)**: Every request is intercepted by Clerk Middleware. Unauthenticated access attempts to `/app/*` are redirected to `/sign-in`, and unauthorized calls to private `/api/*` endpoints are rejected immediately with `HTTP 401 Unauthorized`.
- **Server Component Authorization (`src/lib/auth/require-auth.ts`)**: Protected server components invoke `requireAuth({ requireOnboarding: true })`, which validates the session server-side with Clerk and confirms the user has completed calibration in the Neon database before rendering the workspace.
- **API Endpoint Authorization (`requireApiAuth`)**: All API routes resolve user identity server-side via `auth()` or `currentUser()`.
- **Zero Client Trust**: User IDs, roles, and emails are never accepted from client query strings or request bodies. Identity is strictly derived from the verified server session.

---

## 2. Multi-Tenant Data Access Model & IDOR Prevention

### 2.1 User-Scoped Database Queries
- All database operations in `src/db/repositories/` (conversations, messages, weekly check-ins, email connections, email preferences, AI usage) explicitly filter queries by `clerkUserId`:
  ```ts
  // Example: Strict tenant isolation
  db.select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.clerkUserId, clerkUserId)))
  ```
- **Insecure Direct Object Reference (IDOR) Mitigation**: If a client attempts to retrieve, update, or delete a resource (`conversationId`, `messageId`, `checkinId`) belonging to another user, the query returns `null` or 0 affected rows, rejecting the operation safely.
- **SQL Injection Prevention**: All queries use **Drizzle ORM** parameterized query builders against Neon Serverless Postgres.

---

## 3. Credential Encryption & Secrets Management

### 3.1 AES-256-GCM Authenticated Encryption
- User-provided Gmail Google App Passwords are encrypted before persisting to the `gmail_connections` table using **AES-256-GCM** ([`src/lib/security/encryption.ts`](file:///c:/Users/Girish%20Lade/OneDrive/Desktop/Elevra/src/lib/security/encryption.ts)):
  - **Random Initialization Vector (IV)**: 16 bytes generated uniquely per encryption operation, ensuring identical passwords produce distinct ciphertexts.
  - **Authentication Tag**: 16 bytes (128-bit) GCM authentication tag verified during decryption to detect any database tampering or bit-flipping attacks.
  - **Master Key**: 256-bit server-only key configured via `ENCRYPTION_SECRET`.
- **Zero Credential Leakage**:
  - Plaintext passwords and decrypted secrets are never returned in API responses.
  - Plaintext credentials are never rendered in client components or sent to the browser.
  - Email addresses in SMTP debug logs are masked (e.g., `al***@gmail.com`).

---

## 4. AI Security, Structured Contracts & Prompt Injection Defense

### 4.1 Server-Only NVIDIA NIM Execution
- NVIDIA NIM API keys (`NVIDIA_API_KEY`) and AI endpoints are strictly server-side.
- Client browsers never make direct requests to the AI provider.

### 4.2 Prompt Injection Mitigation
- All user-supplied inputs (names, challenges, goals, conversation snippets) are sanitized before embedding into system prompts using `sanitizeForPrompt` ([`src/lib/security/sanitize.ts`](file:///c:/Users/Girish%20Lade/OneDrive/Desktop/Elevra/src/lib/security/sanitize.ts)).
- LLM control tokens (e.g. `<|im_start|>`, `<|im_end|>`, `[INST]`, `[/INST]`, `<<SYS>>`) and excessive newline cascades are stripped to prevent instruction hijacking.

### 4.3 Structured Output Validation & Safety Fallbacks
- All AI responses are validated at runtime against strict Zod schemas (`coachingOutputSchema`, `weeklyCheckinAiOutputSchema`).
- If an upstream model returns malformed JSON, markdown codeblock noise, or times out, the system automatically recovers via schema parsing utilities or deterministic, personalized fallback syntheses without failing user requests.

### 4.4 Ethical & Non-Medical Boundaries
- Prompts explicitly enforce cognitive coaching boundaries: non-clinical, non-medical, non-legal, with mandatory guidance directing users in crisis to professional support services.

---

## 5. Email Infrastructure & Anti-Relay Protections

### 5.1 Dual-Provider Isolation
- Supports **Resend** and **Gmail SMTP** behind a unified `EmailProvider` interface ([`src/lib/email/provider.ts`](file:///c:/Users/Girish%20Lade/OneDrive/Desktop/Elevra/src/lib/email/provider.ts)).
- All email dispatches occur server-side.
- Test emails are restricted to the verified user's destination address, preventing arbitrary email relay abuse.

### 5.2 HTML Entity Escaping
- All dynamic fields interpolated into email HTML templates (names, goals, challenges, quotes) are escaped via `escapeHtml` ([`src/lib/security/sanitize.ts`](file:///c:/Users/Girish%20Lade/OneDrive/Desktop/Elevra/src/lib/security/sanitize.ts)), neutralizing XSS and email client rendering exploits.

---

## 6. Rate Limiting & Abuse Prevention

### 6.1 Sliding Window Rate Limiter
Implemented in [`src/lib/security/rate-limit.ts`](file:///c:/Users/Girish%20Lade/OneDrive/Desktop/Elevra/src/lib/security/rate-limit.ts) with in-memory sliding window tracking:
- **Coaching Chat (`POST /api/chat`)**: 30 requests / minute per user.
- **Email Test (`POST /api/email/test`)**: 5 dispatches / 10 minutes per user.
- **Email Connect (`POST /api/email/connect`)**: 5 connection tests / 5 minutes per user.
- **Account Export (`POST /api/account/export`)**: 5 exports / hour per user.

---

## 7. Webhook & Cron Security

### 7.1 Bearer Token Authorization
- Vercel Cron invokes `GET /api/cron/weekly-checkin` weekly (`0 9 * * 1`).
- The endpoint validates `Authorization: Bearer <CRON_SECRET>` ([`src/lib/security/cron-auth.ts`](file:///c:/Users/Girish%20Lade/OneDrive/Desktop/Elevra/src/lib/security/cron-auth.ts)). Public or unauthenticated calls receive `HTTP 401 Unauthorized`.

### 7.2 Idempotency & Batch Resilience
- `hasCheckinInWindow` enforces a 6-day lookback guard to prevent duplicate check-in dispatches during overlapping or retried cron triggers.
- Independent per-user `try/catch` execution ensures an individual failure (e.g. revoked Gmail App Password) does not disrupt batch execution.

---

## 8. HTTP Security Headers

Configured in [`next.config.ts`](file:///c:/Users/Girish%20Lade/OneDrive/Desktop/Elevra/next.config.ts) for all response routes:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY` (Clickjacking defense)
- `X-Content-Type-Options: nosniff` (MIME sniffing defense)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`

---

## 9. Privacy, Data Portability & Data Minimization

- **Data Export (`POST /api/account/export`)**: Users can download all profile calibration data, conversation history, message exchanges, weekly check-in records, and AI usage summaries as a structured JSON bundle.
- **Conversation Purge (`POST /api/account/clear-history`)**: Users can erase all coaching dialogues while maintaining account configuration.
- **Application Database Data Wipe (`POST /api/account/delete`)**: Users can permanently erase all rows across `conversations`, `conversation_messages`, `weekly_checkins`, `email_preferences`, `gmail_connections`, `ai_usage`, and `profiles`. Requires explicit confirmation phrase `DELETE MY DATA`.
- **Clerk Identity Separation**: Database records are cleanly separated from authentication provider accounts.
