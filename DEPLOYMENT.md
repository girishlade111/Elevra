# Elevra Production Deployment Guide (Vercel)

This document details the step-by-step procedure for deploying the **Elevra Executive Confidence Coach** web application to production on **Vercel** with **Neon Serverless PostgreSQL**, **Clerk Authentication**, **NVIDIA NIM AI**, **Resend Transactional Email**, and **Gmail SMTP Fallback**.

---

## Architecture Overview

```
                        ┌───────────────────────────────┐
                        │      Client Browser           │
                        │  (Next.js App Router UI)      │
                        └───────────────┬───────────────┘
                                        │ HTTPS
                                        ▼
                        ┌───────────────────────────────┐
                        │      Vercel Edge Network      │
                        │    (Next.js Middleware)       │
                        └───────┬───────────────┬───────┘
                                │               │
                ┌───────────────┘               └───────────────┐
                ▼                                               ▼
  ┌───────────────────────────┐                   ┌───────────────────────────┐
  │   Clerk Auth Service      │                   │   Vercel Serverless SSR   │
  │ (JWT Session Validation)  │                   │       & API Routes        │
  └───────────────────────────┘                   └───────┬───────────┬───────┘
                                                          │           │
                     ┌────────────────────────────────────┼───────────┴──────────┐
                     ▼                                    ▼                      ▼
       ┌───────────────────────────┐        ┌───────────────────────────┐  ┌───────────────────────────┐
       │   Neon PostgreSQL (DB)    │        │  NVIDIA NIM Cloud Engine  │  │ Transactional Email Engine│
       │ (Drizzle ORM Connection)  │        │ (meta/llama-3.1-70b-inst) │  │  • Resend API (Primary)   │
       └───────────────────────────┘        └───────────────────────────┘  │  • Gmail SMTP (Fallback)  │
                                                                           └───────────────────────────┘
```

---

## 1. Neon Database Setup

1. **Create Neon Project**:
   - Log in to the [Neon Console](https://console.neon.tech).
   - Click **New Project** and name it `elevra-production`.
   - Select a region closest to your Vercel deployment region (e.g., `AWS us-east-1` or `AWS us-east-2`).
   - Choose PostgreSQL 16+.

2. **Retrieve Connection String**:
   - In your project dashboard, navigate to **Dashboard** -> **Connection Details**.
   - Select **Pooled connection** (recommended for serverless environments).
   - Copy the connection URI:
     ```text
     postgresql://username:password@ep-sample-pool.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - Keep this string ready for `DATABASE_URL`.

---

## 2. Clerk Authentication Setup

1. **Create Production Application**:
   - Log in to the [Clerk Dashboard](https://dashboard.clerk.com).
   - Switch from development to a **Production Instance** or create a new application named `Elevra`.
   - Under **User & Authentication** -> **Email, Phone, Username**, enable **Email address** and **Password** (or OAuth providers if desired).

2. **Configure Custom Production Domain & DNS**:
   - In Clerk Dashboard, go to **Configure** -> **Domains**.
   - Enter your production domain (e.g., `app.elevra.com` or `elevra.com`).
   - Add the CNAME records provided by Clerk to your DNS provider (Cloudflare, Route53, Namecheap, Vercel DNS):
     - `clerk.yourdomain.com` -> `frontend-api.clerk.services`
     - Accounts / mail CNAME records for verification.
   - Wait for DNS propagation until status shows **Active**.

3. **Configure Redirect & Routing Paths**:
   - In **Configure** -> **Paths**:
     - **Sign-in path**: `/sign-in`
     - **Sign-up path**: `/sign-up`
     - **After sign-in path**: `/app`
     - **After sign-up path**: `/app/onboarding`

4. **Copy API Keys**:
   - Under **API Keys**, copy:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_...`)
     - `CLERK_SECRET_KEY` (`sk_live_...`)

---

## 3. NVIDIA NIM AI Setup

1. **Obtain API Key**:
   - Log in to [build.nvidia.com](https://build.nvidia.com).
   - Navigate to the **API Catalog** -> **meta/llama-3.1-70b-instruct**.
   - Click **Get API Key** and generate a production key.
   - Save the key starting with `nvapi-...`.

2. **Default Endpoints & Models**:
   - **API Base URL**: `https://integrate.api.nvidia.com/v1`
   - **Model Identifier**: `meta/llama-3.1-70b-instruct`
   - Set in environment variables as:
     - `NVIDIA_API_KEY=nvapi-...`
     - `NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1`
     - `NVIDIA_NIM_MODEL=meta/llama-3.1-70b-instruct`

---

## 4. Resend Transactional Email Setup

Resend is the primary provider for weekly check-in emails and automated briefings.

1. **Create Account & Verify Domain**:
   - Sign up at [resend.com](https://resend.com).
   - Go to **Domains** -> **Add Domain** (e.g., `yourdomain.com` or `mail.yourdomain.com`).
   - Add the DNS records provided by Resend to your domain registrar:
     - **SPF** (TXT record)
     - **DKIM** (CNAME / TXT records)
     - **MX** (MX record for delivery status feedback)
   - Click **Verify Domain** in Resend.

2. **Create API Key**:
   - Go to **API Keys** -> **Create API Key**.
   - Name: `elevra-production`.
   - Permissions: **Full Access** or **Sending Access**.
   - Copy key starting with `re_...`.

3. **Configure Environment Variables**:
   - `RESEND_API_KEY=re_...`
   - `RESEND_FROM_EMAIL=Elevra Coach <coach@yourdomain.com>`

---

## 5. Gmail SMTP User Setup (Fallback / Manual Method)

> [!IMPORTANT]
> **Security Notice**: Gmail App Password connections are a supported fallback/manual SMTP method for users wishing to dispatch digests directly from their own personal Gmail accounts. It is **not** the safest connection method compared to managed OAuth2 or dedicated transactional APIs like Resend, but it is supported as a self-managed user option.

### User Setup Workflow in App Settings:
1. **Google 2-Step Verification**: The user must have 2-Step Verification enabled on their Google Account.
2. **Generate Google App Password**:
   - User goes to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
   - App Name: `Elevra Coach`.
   - Google generates a 16-character code (e.g., `abcd efgh ijkl mnop`).
3. **Connect in Elevra**:
   - User opens Elevra -> **Settings** -> **Email Integration**.
   - Selects **Gmail (SMTP)**.
   - Enters their Gmail address and 16-character App Password.
   - Elevra performs a secure live SMTP handshake test.
4. **Server Storage**:
   - The password is encrypted server-side using **AES-256-GCM** with a randomized initialization vector (IV) and authentication tag before insertion into Neon PostgreSQL.
   - Plaintext passwords are never logged, stored in plaintext, or transmitted to client browser bundles.

---

## 6. Vercel Environment Variables Configuration

In the [Vercel Dashboard](https://vercel.com) -> Select Project -> **Settings** -> **Environment Variables**:

| Variable Name | Required | Target Environment | Description |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_APP_URL` | Yes | Production, Preview | Canonical URL (e.g. `https://elevra.com`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Production, Preview | Clerk publishable key (`pk_live_...`) |
| `CLERK_SECRET_KEY` | Yes | Production, Preview | Clerk secret API key (`sk_live_...`) |
| `DATABASE_URL` | Yes | Production, Preview | Neon PostgreSQL connection URI (`?sslmode=require`) |
| `GMAIL_ENCRYPTION_KEY` | Yes | Production, Preview | 64-hex char AES-256 encryption key for credentials |
| `NVIDIA_API_KEY` | Yes | Production, Preview | NVIDIA NIM API token (`nvapi-...`) |
| `NVIDIA_NIM_BASE_URL` | No | Production, Preview | Default: `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_NIM_MODEL` | No | Production, Preview | Default: `meta/llama-3.1-70b-instruct` |
| `RESEND_API_KEY` | Yes | Production, Preview | Resend production API key (`re_...`) |
| `RESEND_FROM_EMAIL` | Yes | Production, Preview | Sender address (e.g. `coach@yourdomain.com`) |
| `CRON_SECRET` | Yes | Production, Preview | High-entropy secret token for Vercel Cron header |

### Generating Secure Random Keys:
```bash
# Generate GMAIL_ENCRYPTION_KEY (64 hex characters / 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate CRON_SECRET (48 hex characters / 24 bytes)
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

---

## 7. Database Migration Process

Run migrations before cutting over traffic to a new production deployment.

### Option A: Run Migration via Drizzle Kit (Recommended)
Run against your production database using `DATABASE_URL`:
```bash
# Ensure DATABASE_URL is set in your terminal or .env
export DATABASE_URL="postgresql://username:password@ep-sample-pool.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Apply pending SQL migration files located in src/db/migrations
npm run db:migrate
```

### Option B: Push Schema Directly (Alternative for rapid sync)
```bash
npm run db:push
```

### Verification:
```bash
# Open Drizzle Studio to inspect table structure
npm run db:studio
```
Verify that all 4 core tables exist:
1. `profiles`
2. `conversations`
3. `conversation_messages`
4. `gmail_connections`
5. `email_preferences`
6. `weekly_checkins`
7. `ai_usage_logs`

---

## 8. Vercel Cron Configuration

The cron schedule is defined in [`vercel.json`](file:///c:/Users/Girish%20Lade/OneDrive/Desktop/Elevra/vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-checkin",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

- **Execution Schedule**: Every Monday at 09:00 UTC (`0 9 * * 1`).
- **Target Endpoint**: `/api/cron/weekly-checkin`.
- **Authentication**: Vercel automatically includes `Authorization: Bearer <CRON_SECRET>` with each invocation when `CRON_SECRET` is configured in project environment variables.
- **Manual Trigger for Verification**:
  ```bash
  curl -X GET "https://yourdomain.com/api/cron/weekly-checkin" \
    -H "Authorization: Bearer YOUR_CRON_SECRET"
  ```

---

## 9. Production Smoke Tests Checklist

After deploying to Vercel, execute these verification checks in order:

- [ ] **1. Public Pages**:
  - Visit `/`, `/pricing`, `/features`, `/how-it-works`, `/about`, `/privacy`, `/terms`.
  - Confirm HTTP 200, clean layout rendering, and no client-side console errors.

- [ ] **2. User Registration & Sign-in**:
  - Visit `/sign-up`, register a new test user.
  - Verify email confirmation and automatic redirect to `/app/onboarding`.

- [ ] **3. Onboarding Multi-Step Flow**:
  - Complete Step 1 (Name), Step 2 (Career Stage), Step 3 (Challenge), Step 4 (Goal).
  - Refresh mid-flow and verify state persistence.
  - Click **Complete Onboarding** and verify redirect to `/app`.

- [ ] **4. AI Executive Coaching Chat**:
  - Send message: *"I need to negotiate a 20% compensation increase with my VP."*
  - Verify streaming/structured response containing advice, actionable step, and follow-up question.
  - Check that a new conversation thread appears in sidebar history.
  - Send follow-up and verify multi-turn context awareness.

- [ ] **5. Email Preferences & Test Dispatch**:
  - Navigate to `/app/settings/email`.
  - Click **Send Test Email** via Resend.
  - Verify inbox receipt of branded Elevra briefing.
  - (Optional) Connect a Gmail test account with 16-character App Password, send test email, verify delivery, and disconnect.

- [ ] **6. Scheduled Check-In Cron Execution**:
  - Trigger `/api/cron/weekly-checkin` using curl with `Bearer <CRON_SECRET>`.
  - Verify JSON response shows `processedCount >= 1` and `sentCount >= 1`.
  - Verify check-in record appears in database with status `sent`.

- [ ] **7. Security & IDOR Verification**:
  - Attempt to access another user's conversation ID via API — verify `404 NOT_FOUND`.
  - Attempt unauthenticated request to `/api/chat` — verify `401 UNAUTHORIZED`.

- [ ] **8. Data Privacy & Account Lifecycle**:
  - Navigate to `/app/settings`.
  - Export user data JSON bundle — verify no encrypted passwords or internal secrets are present.
  - Test **Clear History** — verify conversations are wiped.
  - Test **Delete Account** — verify all profile and message rows are permanently removed.

---

## 10. Rollback & Troubleshooting Procedures

### 1. Instant Deployment Rollback (Vercel)
If a critical runtime issue or regression occurs:
1. Open **Vercel Dashboard** -> **Deployments**.
2. Find the last known stable deployment.
3. Click the **•••** menu -> **Promote to Production** (instant instant traffic cutover).

### 2. Database Connection Issues (`DATABASE_URL`)
- **Symptoms**: 500 errors on API routes, `NeonDbError`, or connection timeouts.
- **Remediation**:
  - Check Neon Console for compute endpoint state (ensure it is not suspended).
  - Confirm `DATABASE_URL` contains `?sslmode=require`.
  - Verify connection pooling is enabled (`-pooler` suffix in hostname).

### 3. NVIDIA NIM API Failures
- **Symptoms**: AI chat returns 502 / 504 status codes.
- **Remediation**:
  - Verify `NVIDIA_API_KEY` is valid at [build.nvidia.com](https://build.nvidia.com).
  - Confirm API rate limits on your NVIDIA NGC account.
  - Elevra automatically surfaces retryable user guidance on rate limits and falls back cleanly for weekly check-in synthesis.

### 4. Email Delivery Failures
- **Symptoms**: Weekly check-ins or test emails return `DELIVERY_FAILED`.
- **Remediation**:
  - **Resend**: Verify domain DNS records (SPF, DKIM) show "Verified" in Resend dashboard.
  - **Gmail**: Verify user hasn't revoked their App Password and Google 2-Step Verification remains enabled.
