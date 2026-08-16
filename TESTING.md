# Elevra — Comprehensive Test Architecture & QA Guide

This document outlines the testing strategy, test suite architecture, automated execution commands, and the manual QA checklist for the complete Elevra product.

---

## 1. Test Architecture Overview

Elevra's automated test suite validates the entire business logic, security invariants, data isolation, and upstream provider integrations across 9 primary domains:

```
src/
├── app/api/
│   ├── account/          # Account clear-history, export, and cascade delete tests
│   ├── chat/             # Multi-turn coaching, 5-exchange context window, NIM error mapping
│   ├── conversations/    # Conversation CRUD, thread retrieval, strict IDOR prevention
│   ├── cron/             # CRON_SECRET auth, batch dispatch, mixed providers, idempotency
│   ├── email/            # Preferences, Gmail connect/disconnect, test email rate limits
│   ├── onboarding/       # 4-step wizard validation, resume across refresh, direct submit
│   └── profile/          # Profile retrieval and PATCH updates
├── db/
│   ├── repositories/     # Profiles, conversations, messages, check-ins, AI usage accounting
│   └── schema/           # Drizzle schema definitions and tenant isolation rules
├── lib/
│   ├── ai/               # NVIDIA NIM provider, structured prompt synthesis, fallback retry
│   ├── auth/             # Clerk route guards, SSR authentication, onboarding gatekeeper
│   ├── coaching/         # Intent detection, title generation, check-in synthesis engine
│   ├── email/            # Resend provider, Gmail SMTP (Nodemailer), template rendering
│   ├── observability/    # Structured logging, correlation IDs, secret redaction
│   └── security/         # AES-256-GCM encryption, rate limiting, prompt injection defense
```

---

## 2. Automated Test Execution

### Run Full Test Suite (190+ Automated Tests)
```bash
npm test
```

### Run Targeted Test Suites
```bash
# Authentication & Guard tests
npx tsx --test src/lib/auth/__tests__/*.test.ts

# Database Repositories & Tenant Isolation tests
npx tsx --test src/db/__tests__/*.test.ts

# Onboarding Step Wizard & Persistence tests
npx tsx --test src/app/api/onboarding/__tests__/*.test.ts

# AI Coaching & Multi-turn Chat tests
npx tsx --test src/app/api/chat/__tests__/*.test.ts

# Conversation Management & IDOR tests
npx tsx --test src/app/api/conversations/__tests__/*.test.ts

# Email Service & Provider Orchestration tests
npx tsx --test src/lib/email/__tests__/*.test.ts

# Settings, Preferences & Account Management tests
npx tsx --test src/app/api/settings/__tests__/*.test.ts

# Weekly Check-in Cron & Idempotency tests
npx tsx --test src/app/api/cron/__tests__/*.test.ts

# Comprehensive Security, Cryptography & Rate Limiting tests
npx tsx --test src/lib/security/__tests__/*.test.ts
```

### Type Checking, Linting & Build Verification
```bash
# TypeScript compiler verification (0 errors)
npm run typecheck

# Next.js ESLint verification (0 warnings/errors)
npm run lint

# Production Next.js build compilation
npm run build
```

---

## 3. Test Suites & Coverage Summary

| Domain | Test File | Key Scenarios Covered |
| :--- | :--- | :--- |
| **Auth & Guards** | `src/lib/auth/__tests__/auth-guards.test.ts` | Unauthenticated 401s, SSR redirects, onboarding gatekeeper, tenant sync fallbacks. |
| **Database Repositories** | `src/db/__tests__/repositories.test.ts` | Profile CRUD, conversation creation, message persistence, bounded history retrieval, cascading deletions, strict tenant isolation / IDOR prevention, AES-256 encrypted credential storage, 6-day check-in idempotency window, and AI token accounting. |
| **Onboarding** | `src/app/api/onboarding/__tests__/onboarding-route.test.ts` | Step 1 (Name), Step 2 (Career Stage enum), Step 3 (Challenge enum), Step 4 (Monthly Goal + completion), resume after refresh, duplicate submission idempotency, direct payload submission, malformed payload rejection. |
| **AI Chat & Coaching** | `src/app/api/chat/__tests__/chat-route.test.ts` | Auto-conversation creation with contextual title generation, 5-exchange context window (10 messages max), intent detection, NIM schema validation, 429 rate limit error mapping, 504 timeout error mapping, 502 server error mapping, malformed JSON recovery, conversation cross-tenant isolation. |
| **Conversations** | `src/app/api/conversations/__tests__/conversations-route.test.ts` | Scoped list retrieval, custom conversation creation, structured message thread retrieval, thread deletion with cascading messages, IDOR cross-tenant access rejection (404 NOT_FOUND). |
| **Email Services** | `src/lib/email/__tests__/email-service.test.ts` | Resend API delivery, missing API key handling, Gmail SMTP delivery with 16-char App Password, whitespace stripping, SMTP authentication failure mapping, disconnected Gmail fallback, dynamic provider resolution. |
| **Settings & Account** | `src/app/api/settings/__tests__/settings-routes.test.ts` | Switch provider (Resend <-> Gmail), enable/disable weekly check-ins, connect Gmail with AES-256 storage, disconnect Gmail, dispatch test email with sliding-window rate limit, profile PATCH updates, clear conversation history, export complete JSON bundle without credentials, permanent account deletion. |
| **Weekly Cron** | `src/app/api/cron/__tests__/cron-route.test.ts` | `CRON_SECRET` Bearer authentication, single-user force run, multi-user batch execution, mixed providers (Resend + Gmail), 6-day idempotency window duplicate prevention, partial failure resilience, NIM failure fallback synthesis, delivery failure logging. |
| **Security & Privacy** | `src/lib/security/__tests__/comprehensive-security.test.ts` | Cross-user IDOR prevention across all entities, AES-256-GCM encryption with randomized IVs and auth tag tampering detection, public model secret redaction, rate limiter tiers (CHAT, EMAIL_CONNECT, ACCOUNT_EXPORT), prompt injection neutralization (`<\|im_start\|>`, `<<SYS>>`, `[INST]`), XSS HTML escaping. |

---

## 4. Manual QA Verification Checklist

Execute this checklist for end-to-end user experience and edge case validation:

### 4.1 Authentication & Onboarding
- [ ] **Unauthenticated Access**: Navigate to `/chat`, `/settings`, or `/onboarding` while logged out. Verify immediate redirect to `/sign-in` with return URL preserved.
- [ ] **Sign-Up Flow**: Complete Clerk sign-up. Verify automatic redirect to `/onboarding`.
- [ ] **Step 1 (Name)**: Enter valid name. Verify step indicator moves to Step 2. Refresh browser; verify Step 2 remains active with Step 1 data preserved.
- [ ] **Step 2 (Career Stage)**: Select a stage (e.g. "Senior or Leadership"). Verify selection state is visually highlighted.
- [ ] **Step 3 (Challenge)**: Select primary challenge (e.g. "Salary negotiation"). Verify smooth transition.
- [ ] **Step 4 (Goal)**: Enter monthly goal. Click "Complete Onboarding". Verify redirection to `/chat` and confetti/welcome state.
- [ ] **Completed User Guard**: Attempt navigating back to `/onboarding`. Verify immediate redirection to `/chat`.

### 4.2 Desktop & Mobile Responsiveness
- [ ] **Desktop (1440px / 1080px)**:
  - Sidebar displays conversation list, new chat button, profile chip, and settings link.
  - Chat layout centers the conversation container with proper max-width.
  - Keyboard navigation: `Tab` moves through inputs, chips, and send button; `Enter` sends message; `Shift+Enter` inserts newline.
- [ ] **Mobile (375px / 414px)**:
  - Header displays hamburger menu for sidebar drawer and Elevra wordmark.
  - Input field docks above mobile keyboard without viewport jitter.
  - Tap targets meet 44x44px touch target guidelines.
  - Action cards and follow-up chips wrap cleanly on small screens.

### 4.3 Executive AI Coaching Chat
- [ ] **New Session**: Send "How do I ask for a 20% raise during my review?". Verify coaching response streams or displays with:
  - Contextual conversation title generated automatically in sidebar.
  - Detected Intent badge (e.g. "Salary Negotiation").
  - Structured sections: Core Advice, Actionable Steps, Cognitive Reframes, Practice Scenario, Follow-up Questions.
- [ ] **Multi-Turn Context**: Click a follow-up chip. Verify coach remembers previous turn context and addresses specifics.
- [ ] **Empty / Rapid Input**: Submit empty message; verify send button is disabled. Spam send button; verify UI handles debouncing gracefully.
- [ ] **Session Switching**: Click an older conversation in sidebar. Verify full message history loads accurately.
- [ ] **Session Deletion**: Click delete icon on a conversation. Confirm modal; verify item is removed from sidebar and current view resets.

### 4.4 Email Integration & Settings
- [ ] **Provider Switching**: Go to `/settings`. Change email provider from Resend to Gmail.
- [ ] **Connect Gmail**:
  - Enter Gmail address and 16-character Google App Password (with spaces like `abcd efgh ijkl mnop`).
  - Click "Connect & Verify". Verify validation strips spaces, verifies SMTP connection, and shows success toast.
  - Verify stored password is never exposed in UI or network responses.
- [ ] **Send Test Email**: Click "Send Test Email". Check inbox for verified delivery with personalized Elevra branding.
- [ ] **Disconnect Gmail**: Click "Disconnect Gmail". Verify credentials are wiped and provider reverts to Resend.
- [ ] **Toggle Weekly Check-ins**: Switch check-in toggle off/on. Refresh page; verify setting persists.

### 4.5 Weekly Check-in Cron
- [ ] **Unauthorized Request**: Make a `GET /api/cron/weekly-checkin` without headers. Verify `401 Unauthorized` with `UNAUTHORIZED_CRON` code.
- [ ] **Manual Dev Run**: Make `GET /api/cron/weekly-checkin?userId=<your_id>` with Bearer `CRON_SECRET`. Verify digest synthesis and email dispatch.
- [ ] **Idempotency Window**: Trigger the cron again immediately for the same user. Verify `skippedCount: 1` and `sentCount: 0`.

### 4.6 Privacy & Account Lifecycle
- [ ] **Export Data**: Click "Export Account Data" in Settings. Verify downloaded `.json` file contains complete profile, conversation history, check-in history, and contains NO plaintext passwords or API keys.
- [ ] **Clear History**: Click "Clear Conversation History". Confirm; verify all conversations and messages are wiped while profile remains.
- [ ] **Delete Account**: Click "Delete Account & All Data". Confirm warning modal; verify all database rows (profile, messages, connections, check-ins) are permanently erased and session terminates.
