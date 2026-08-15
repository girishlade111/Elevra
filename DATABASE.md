# DATABASE.md — Elevra Database Layer

## Overview

Elevra uses **Neon PostgreSQL** (serverless Postgres) with **Drizzle ORM** for all persistent data.
The database layer is **server-only** — it is never imported in client components or API responses that flow to the browser.

---

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| [Neon PostgreSQL](https://neon.tech) | Latest | Serverless Postgres host |
| [@neondatabase/serverless](https://github.com/neondatabase/serverless) | `^0.10` | HTTP adapter for Edge / Serverless |
| [drizzle-orm](https://orm.drizzle.team) | `^0.39` | Type-safe ORM |
| [drizzle-kit](https://orm.drizzle.team/kit-docs) | `^0.30` | Migration CLI |

---

## Schema Reference

### Authentication Identity

All tables use **`clerk_user_id`** (the Clerk-issued user identifier) as the tenant key.
There is **no separate `users` table** — Clerk is the authoritative identity provider.

---

### `profiles`

One row per Clerk user. Created on first sign-in via `upsertProfile`.

| Column | Type | Description |
|---|---|---|
| `id` | `text` PK | nanoid primary key |
| `clerk_user_id` | `text` UNIQUE | Clerk userId |
| `email` | `text` | User email from Clerk |
| `name` | `text?` | Display name |
| `career_stage` | `text?` | Enum: student, early_career, mid_career, senior, executive, career_changer |
| `challenge` | `text?` | Current coaching challenge |
| `monthly_goal` | `text?` | Monthly objective |
| `onboarding_step` | `int` | 0-indexed step counter |
| `onboarding_completed` | `bool` | Whether onboarding is done |
| `joined_at` | `timestamptz` | First sign-up time |
| `last_active_at` | `timestamptz` | Updated on each session |
| `created_at` | `timestamptz` | Row creation time |
| `updated_at` | `timestamptz` | Last modification time |

**Indexes:** `clerk_user_id` (unique + lookup)

---

### `conversations`

A conversation is a container. Messages are stored separately.

| Column | Type | Description |
|---|---|---|
| `id` | `text` PK | nanoid |
| `clerk_user_id` | `text` | Owner |
| `title` | `text` | Human-readable title (editable) |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | Bumped when messages are added |

**Indexes:** `clerk_user_id`, `created_at`

---

### `conversation_messages`

Actual chat turns within a conversation.

| Column | Type | Description |
|---|---|---|
| `id` | `text` PK | nanoid |
| `conversation_id` | `text` FK → `conversations.id` | Parent conversation (CASCADE DELETE) |
| `clerk_user_id` | `text` | Owner (denormalized for query efficiency) |
| `role` | `text` | Enum: `user` \| `assistant` \| `system` |
| `content` | `text` | Message body |
| `intent` | `text?` | Enum: `salary` \| `interview` \| `career_change` \| `leadership` \| `confidence` \| `balance` \| `general` |
| `created_at` | `timestamptz` | |

**Indexes:** `conversation_id`, `clerk_user_id`, `created_at`
**FK:** `conversation_id` → `conversations.id` ON DELETE CASCADE

---

### `ai_usage`

Tracks every AI API call for token budgeting and audit.

| Column | Type | Description |
|---|---|---|
| `id` | `text` PK | nanoid |
| `clerk_user_id` | `text` | Owner |
| `endpoint_type` | `text` | e.g. `"coaching"`, `"classify_intent"` |
| `model` | `text` | Model identifier |
| `input_tokens` | `int` | Prompt tokens |
| `output_tokens` | `int` | Completion tokens |
| `total_tokens` | `int` | `input + output` |
| `created_at` | `timestamptz` | |

**Indexes:** `clerk_user_id`, `created_at`

---

### `conversation_memory`

Single running summary per user for long-term AI context.

| Column | Type | Description |
|---|---|---|
| `id` | `text` PK | nanoid |
| `clerk_user_id` | `text` UNIQUE | One row per user |
| `summary` | `text` | Compressed narrative of coaching history |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:** `clerk_user_id`

---

### `gmail_connections`

Stores Gmail SMTP credentials with AES-256-GCM encryption.

| Column | Type | Description |
|---|---|---|
| `id` | `text` PK | nanoid |
| `clerk_user_id` | `text` UNIQUE | One connection per user |
| `email` | `text` | Gmail address |
| `encrypted_app_password` | `text` | AES-256-GCM ciphertext (see Security section) |
| `provider` | `text` | Enum: `resend` \| `gmail` |
| `is_connected` | `bool` | Last test result |
| `last_tested_at` | `timestamptz?` | Timestamp of last connectivity test |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:** `clerk_user_id` (unique + lookup)

> [!CAUTION]
> `encrypted_app_password` must **never** appear in API responses.
> Use `getEmailConnection()` (safe) or `getEmailConnectionWithCredentials()` (decrypt in-process only).

---

### `email_preferences`

Per-user email delivery settings.

| Column | Type | Description |
|---|---|---|
| `id` | `text` PK | nanoid |
| `clerk_user_id` | `text` UNIQUE | One row per user |
| `provider` | `text` | Enum: `resend` \| `gmail` |
| `weekly_checkins_enabled` | `bool` | Whether weekly emails are active |
| `destination_email` | `text?` | Override destination (defaults to profile email) |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

### `weekly_checkins`

Every weekly check-in attempt is recorded here.

| Column | Type | Description |
|---|---|---|
| `id` | `text` PK | nanoid |
| `clerk_user_id` | `text` | Owner |
| `provider` | `text` | Enum: `resend` \| `gmail` |
| `recipient_email` | `text` | Destination address |
| `subject` | `text` | Email subject line |
| `content` | `text` | Email body (HTML or text) |
| `status` | `text` | Enum: `pending` \| `sent` \| `failed` \| `skipped` |
| `provider_message_id` | `text?` | Provider's message ID (for tracking) |
| `error_message` | `text?` | Error detail if `status = failed` |
| `sent_at` | `timestamptz?` | Time of successful send |
| `created_at` | `timestamptz` | |

**Indexes:** `clerk_user_id`, `created_at`, `status`

---

## Relations

```
profiles          (1) ──── (0..*) conversations
conversations     (1) ──── (0..*) conversation_messages   [FK + CASCADE DELETE]
profiles          (1) ──── (0..1) conversation_memory
profiles          (1) ──── (0..*) ai_usage
profiles          (1) ──── (0..1) gmail_connections
profiles          (1) ──── (0..1) email_preferences
profiles          (1) ──── (0..*) weekly_checkins
```

All relations are by `clerk_user_id` matching (not FK joins, except messages → conversation).

---

## Indexes

| Table | Index | Columns | Purpose |
|---|---|---|---|
| profiles | UNIQUE | `clerk_user_id` | One profile per Clerk user |
| conversations | INDEX | `clerk_user_id` | List user's conversations |
| conversations | INDEX | `created_at` | Sorting |
| conversation_messages | INDEX | `conversation_id` | Load messages for a conversation |
| conversation_messages | INDEX | `clerk_user_id` | Cross-conversation user queries |
| conversation_messages | INDEX | `created_at` | Recent message queries |
| ai_usage | INDEX | `clerk_user_id` | Per-user usage queries |
| ai_usage | INDEX | `created_at` | Time-range aggregations |
| gmail_connections | UNIQUE | `clerk_user_id` | One connection per user |
| email_preferences | UNIQUE | `clerk_user_id` | One preference row per user |
| weekly_checkins | INDEX | `clerk_user_id` | Per-user checkin history |
| weekly_checkins | INDEX | `created_at` | Recent checkins |
| weekly_checkins | INDEX | `status` | Query pending checkins |

---

## Migration Workflow

Migrations are managed with `drizzle-kit` and live in `src/db/migrations/`.

### Prerequisites

1. Create a Neon project at [neon.tech](https://neon.tech).
2. Copy the connection string to `.env`:
   ```env
   DATABASE_URL="postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
3. Generate an encryption key and add to `.env`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # → copy output to ENCRYPTION_KEY in .env
   ```

### Commands

```bash
# 1. Generate migration SQL from schema changes
npm run db:generate

# 2. Apply migrations to the configured Neon database
npm run db:migrate

# 3. Open Drizzle Studio (visual DB browser)
npm run db:studio
```

### First-Time Setup

```bash
npm run db:generate   # creates src/db/migrations/0000_*.sql
npm run db:migrate    # applies it to Neon
```

### After Schema Changes

```bash
# Edit src/db/schema/*.ts  →  npm run db:generate  →  npm run db:migrate
```

> [!WARNING]
> Never edit the SQL files in `src/db/migrations/` by hand. Always use `db:generate`.

---

## File Structure

```
src/db/
├── index.ts                  ← Drizzle DB singleton (getDb)
├── schema.ts                 ← Flat barrel for drizzle.config.ts
├── types.ts                  ← Database type alias
├── schema/
│   ├── index.ts              ← Schema barrel
│   ├── users.ts              ← profiles table
│   ├── coaching.ts           ← conversations, messages, ai_usage, memory
│   └── emails.ts             ← gmail_connections, email_preferences, weekly_checkins
├── migrations/               ← Generated SQL migration files
│   └── 0000_initial.sql
└── repositories/
    ├── index.ts              ← Repository barrel
    ├── profile.repository.ts
    ├── conversation.repository.ts
    ├── message.repository.ts
    ├── email-connection.repository.ts
    ├── email-preference.repository.ts
    ├── weekly-checkin.repository.ts
    ├── ai-usage.repository.ts
    └── memory.repository.ts

src/lib/security/
└── encryption.ts             ← AES-256-GCM encrypt/decrypt

drizzle.config.ts             ← drizzle-kit configuration
```

---

## Credential Storage Strategy

### Problem

Users can connect their Gmail account by providing an **App Password**. This is a sensitive credential that must not be stored in plaintext.

### Solution: AES-256-GCM Authenticated Encryption

The App Password is encrypted using AES-256-GCM before insertion and decrypted only when needed server-side to send an email.

**Key management:**
- The encryption key is a 32-byte random value stored as `ENCRYPTION_KEY` in `.env`/environment secrets.
- It is **never** committed to source control and **never** sent to the client.

**Ciphertext format:**
```
<iv_hex>:<authTag_hex>:<ciphertext_hex>
```

- `iv` — 12-byte random IV (unique per encryption call)
- `authTag` — 16-byte GCM authentication tag (detects tampering)
- `ciphertext` — AES-256 encrypted content

**Code location:** [`src/lib/security/encryption.ts`](./src/lib/security/encryption.ts)

**Security invariants enforced in the repository layer:**
- `getEmailConnection()` — strips `encryptedAppPassword` before returning
- `getEmailConnectionWithCredentials()` — decrypts in-process, returns plaintext as `appPassword` — **NEVER** serialize this to HTTP responses
- `upsertEmailConnection()` — always encrypts the incoming plaintext before writing

### Generating the Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (64 hex chars) to `ENCRYPTION_KEY` in your `.env` file.

---

## Repository API Reference

| Repository | Key Functions |
|---|---|
| profile | `upsertProfile`, `getProfile`, `updateOnboarding`, `updateLastActive` |
| conversation | `createConversation`, `getConversation`, `listConversations`, `updateConversationTitle`, `touchConversation`, `deleteConversation` |
| message | `createMessage`, `getMessages`, `getRecentMessages`, `countMessages` |
| email-connection | `upsertEmailConnection`, `getEmailConnection`, `getEmailConnectionWithCredentials`, `updateLastTested`, `deleteEmailConnection` |
| email-preference | `upsertEmailPreference`, `getEmailPreference` |
| weekly-checkin | `createCheckin`, `updateCheckinStatus`, `listCheckins`, `getLastCheckin` |
| ai-usage | `recordUsage`, `getUsageSummary`, `listUsage` |
| memory | `upsertMemory`, `getMemory`, `deleteMemory` |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | Neon PostgreSQL connection string |
| `ENCRYPTION_KEY` | ✅ Yes (if Gmail used) | 64-char hex AES-256 key |

See `.env.example` for the full template.
