# Elevra AI Executive Confidence Coach — Complete System Guide

A production-grade, full-stack AI coaching platform designed to dismantle imposter syndrome, prepare for high-stakes conversations, and cultivate executive communication skills through structured daily micro-actions and automated weekly reflection syntheses.

---

## Architecture Overview

```mermaid
graph TD
    User([Client / Browser]) -->|HTTPS / Next.js SSR| ClerkMW[Clerk Edge Middleware: src/middleware.ts]
    ClerkMW -->|Session Verification| AppRouter[Next.js 15 App Router]
    
    subgraph "Public & Marketing Tier"
        AppRouter --> Home[Home: /]
        AppRouter --> Features[Features: /features]
        AppRouter --> HowItWorks[How It Works: /how-it-works]
        AppRouter --> Pricing[Pricing: /pricing]
        AppRouter --> About[About: /about]
    end

    subgraph "Authenticated Application Tier"
        AppRouter --> Onboarding[Onboarding Diagnostic: /app/onboarding]
        AppRouter --> Dashboard[Coach Dashboard: /app]
        AppRouter --> ChatRoute[Live Coaching Engine: /app/chat]
        AppRouter --> Settings[Settings & Integrations: /app/settings]
    end

    subgraph "Services & Intelligence Layer"
        ChatRoute --> NimService[NVIDIA NIM Engine: Meta LLaMA-3.1-70B]
        Dashboard --> Drizzle[(Neon Serverless PostgreSQL)]
        Settings --> Crypto[AES-256-GCM Encryption Utility]
    end

    subgraph "Scheduled Automation & Notifications"
        VercelCron([Vercel Cron @ 09:00 UTC]) -->|Bearer HMAC| CronAPI[/api/cron/weekly-checkin]
        CronAPI --> EmailService[Dual Email Engine]
        EmailService --> Resend[Resend API]
        EmailService --> Gmail[Nodemailer Gmail SMTP]
    end
```

---

## 1. Quickstart & Local Setup

### Prerequisites
- **Node.js**: v18.18.0 or higher (v20+ recommended)
- **npm** or **pnpm**
- **Accounts (Free tiers available)**:
  1. [Clerk](https://clerk.com) (Authentication & User Sessions)
  2. [Neon](https://neon.tech) (PostgreSQL Database)
  3. [NVIDIA NIM](https://build.nvidia.com) (AI Inference Engine)
  4. [Resend](https://resend.com) (Transactional Email) or a Gmail account with 2-Step Verification

---

### Step 1: Clone & Install Dependencies

```bash
git clone <repository-url>
cd Elevra
npm install
```

---

### Step 2: Configure Environment Variables

Copy the example environment file to `.env.local`:

```bash
# Windows PowerShell
Copy-Item .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```

Open `.env.local` and populate the required keys:

```env
# ==============================================================================
# 1. APPLICATION URL
# ==============================================================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ==============================================================================
# 2. CLERK AUTHENTICATION (https://dashboard.clerk.com -> API Keys)
# ==============================================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_CLERK_KEY$"
CLERK_SECRET_KEY="sk_test_YOUR_ACTUAL_CLERK_SECRET_KEY"

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/app"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/app/onboarding"

# ==============================================================================
# 3. DATABASE (Neon PostgreSQL - https://neon.tech)
# ==============================================================================
DATABASE_URL="postgresql://username:password@ep-sample-pool.us-east-2.aws.neon.tech/neondb?sslmode=require"

# ==============================================================================
# 4. CREDENTIAL ENCRYPTION (AES-256-GCM - exactly 64 hex characters)
# ==============================================================================
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
GMAIL_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# ==============================================================================
# 5. AI ENGINE (NVIDIA NIM - https://build.nvidia.com)
# ==============================================================================
NVIDIA_API_KEY="nvapi-YOUR_NVIDIA_API_KEY"
NVIDIA_NIM_BASE_URL="https://integrate.api.nvidia.com/v1"
NVIDIA_NIM_MODEL="meta/llama-3.1-70b-instruct"

# ==============================================================================
# 6. TRANSACTIONAL EMAIL (Resend - https://resend.com)
# ==============================================================================
RESEND_API_KEY="re_YOUR_RESEND_API_KEY"
RESEND_FROM_EMAIL="Elevra Coach <coach@yourdomain.com>"

# ==============================================================================
# 7. SCHEDULED CRON SECURITY
# ==============================================================================
# Generate with: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
CRON_SECRET="your_secure_cron_bearer_token_123456"
```

---

### Step 3: Run Database Migrations

Push the schema directly to your Neon database:

```bash
npm run db:push
```

To open Drizzle Studio for visual database browsing:

```bash
npm run db:studio
```

---

### Step 4: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Running Automated Tests

Elevra includes a comprehensive test suite (193 tests) covering authentication guards, API routes, email providers, security invariants, AES-256-GCM encryption, rate limiting, and coaching logic:

```bash
npm test
```

### Type Checking & Linting

```bash
npm run typecheck
npm run lint
```

---

## 3. Key Architectural Concepts

### Dual Email Provider Routing
Elevra supports dynamic provider resolution:
1. **Managed Resend API**: Default provider for all accounts using `RESEND_API_KEY`.
2. **Custom Gmail SMTP**: Users can connect their personal Gmail using an App Password. The password is encrypted with **AES-256-GCM** authenticated encryption prior to database storage.

### Middleware Placement
In Next.js with a `src/` directory, the edge middleware **must** reside at `src/middleware.ts`. It handles:
- Protecting `/app/*` routes from unauthenticated access.
- Redirecting authenticated users away from `/sign-in` and `/sign-up` to `/app`.
- Rejecting unauthorized `/api/*` requests with HTTP 401.

### Multi-Tenant Isolation & IDOR Protection
All database queries in `src/db/repositories/` enforce tenant scoping via the authenticated Clerk `userId`. Cross-user inspection, modification, or deletion of conversation transcripts, memory vectors, or email credentials is strictly blocked at the repository layer.

---

## 4. Troubleshooting & FAQs

### Q: `Publishable key not valid.`
- **Cause**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local` contains placeholder dots (`pk_test_...`) instead of an actual Clerk key.
- **Fix**: Sign in to [dashboard.clerk.com](https://dashboard.clerk.com), copy your real key (`pk_test_...$`), paste it into `.env.local`, and restart `npm run dev`.

### Q: `Clerk: clerkMiddleware() was not run, your middleware file might be misplaced.`
- **Cause**: `middleware.ts` is placed at the project root instead of `src/middleware.ts`.
- **Fix**: The middleware has been relocated to `src/middleware.ts`.

### Q: Gmail SMTP says "Invalid App Password"
- **Cause**: Regular Gmail passwords cannot be used.
- **Fix**:
  1. Enable **2-Step Verification** on your Google Account.
  2. Go to **Security → App Passwords** in your Google Account settings.
  3. Generate a 16-character app password and enter it in Elevra's Settings page.

---

## 5. Project Directory Structure

```
├── src/
│   ├── app/
│   │   ├── (marketing)/         # Public landing, features, how-it-works, pricing, about
│   │   ├── (auth)/              # Clerk Sign-In & Sign-Up routes
│   │   ├── (app)/               # Protected coaching dashboard, chat, settings, onboarding
│   │   ├── api/                 # Chat, Conversations, Settings, Cron routes
│   │   ├── layout.tsx           # Root application layout with ClerkProvider
│   │   └── globals.css          # Design system CSS variables and utilities
│   ├── components/
│   │   ├── ui/                  # Reusable components (button, card, badge, input, etc.)
│   │   ├── layout/              # PublicHeader, PublicFooter, AppSidebar, Container
│   │   └── settings/            # EmailSettingsView, SecuritySettings
│   ├── config/                  # App constants, routes, environment validation schemas
│   ├── db/                      # Drizzle ORM schema, client connection, repositories
│   ├── lib/
│   │   ├── ai/                  # NVIDIA NIM client & prompt engineering
│   │   ├── auth/                # Clerk SSR guards, session resolvers, user sync
│   │   ├── coaching/            # Check-in engine, intent classifier, title generator
│   │   ├── email/               # Resend & Gmail SMTP providers, HTML templates
│   │   └── security/            # AES-256-GCM encryption, rate limiters, sanitizers
│   └── middleware.ts            # Clerk Edge Route Protection Middleware
├── drizzle.config.ts            # Drizzle migration and database configuration
├── tailwind.config.ts           # Dark-mode design system color tokens & typography
└── vercel.json                  # Production cron schedule configuration
```
