# Elevra — AI Executive Confidence Coach

> Production-grade personalized AI coaching system for building real-world confidence, tracking growth, and automated weekly check-ins.

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/)
[![NVIDIA NIM](https://img.shields.io/badge/AI-NVIDIA_NIM_LLaMA--3.1--70B-green?logo=nvidia)](https://build.nvidia.com/)
[![Clerk Auth](https://img.shields.io/badge/Auth-Clerk_v6-6C47FF?logo=clerk)](https://clerk.com/)
[![Neon Database](https://img.shields.io/badge/Postgres-Neon_Serverless-00E599?logo=postgresql)](https://neon.tech/)
[![Tests](https://img.shields.io/badge/Tests-193%20passed-success)](TESTING.md)

---

## 📚 Documentation Sitemap

- 📖 **[System Setup & Getting Started Guide](GUIDE.md)**: Step-by-step setup, environment variable configuration, and troubleshooting.
- 🏛️ **[System Architecture](ARCHITECTURE.md)**: In-depth technical architecture, data flow diagrams, and component models.
- 🔐 **[Security Specification](SECURITY.md)**: AES-256-GCM encryption, multi-tenant isolation, IDOR prevention, and rate limiting.
- 🧪 **[Testing Specification](TESTING.md)**: Test suites, coverage metrics, and reproduction instructions.
- 🚀 **[Deployment Guide](DEPLOYMENT.md)**: Production deployment to Vercel, Neon, and Clerk.
- 🗄️ **[Database Architecture](DATABASE.md)**: Schema definitions, indexes, relations, and migration commands.
- 📊 **[Observability & Monitoring](OBSERVABILITY.md)**: Structured logging, correlation IDs, and metrics.

---

## ⚡ Quick Start

```bash
# 1. Clone the repository and install dependencies
npm install

# 2. Copy and configure your environment variables
cp .env.example .env.local

# 3. Push the database schema to your Neon PostgreSQL instance
npm run db:push

# 4. Start the development server
npm run dev

# 5. Run the automated test suite
npm test
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router, React 19) | Server Components, Edge Middleware, Route Handlers |
| **Authentication** | Clerk Auth (`@clerk/nextjs` v6) | Native SSR authentication, protected route guards |
| **AI Inference** | NVIDIA NIM (`meta/llama-3.1-70b-instruct`) | Low-latency streaming completions, intent classification |
| **Database** | Neon Serverless PostgreSQL + Drizzle ORM | Scalable SQL storage with type-safe schema definitions |
| **Email Services** | Resend API + Nodemailer Gmail SMTP | Automated Monday digests, AES-256-GCM encrypted passwords |
| **Styling** | Tailwind CSS + Lucide React | Custom dark-mode design system (`#0d0d0d` / `#e07856`) |
| **Job Scheduling** | Vercel Cron | Weekly automated check-in triggers (`0 9 * * 1`) |

---

## 📄 License

Proprietary & Confidential — Elevra Architecture.
