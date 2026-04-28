# NugAI — Codebase Documentation

## Overview

**NugAI** adalah aplikasi web AI Task Generator untuk mahasiswa, dibangun menggunakan **Next.js 16** dengan **App Router**. Aplikasi ini membantu mahasiswa menghasilkan jawaban tugas akademik (Diskusi & Soal) menggunakan AI, dilengkapi pencarian referensi web real-time, OCR untuk gambar soal, dan export PDF profesional.

- **Framework**: Next.js 16.2.4 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19, Tailwind CSS 4, Radix UI, Lucide Icons
- **Database**: PostgreSQL (via Prisma ORM 5.22)
- **Auth**: NextAuth v5 (beta.31) — Credentials provider, JWT strategy
- **AI SDK**: Vercel AI SDK (`ai` v6) + `@ai-sdk/openai`, `@ai-sdk/deepseek`
- **Search**: Tavily & Exa API (web search untuk referensi akademik)
- **OCR**: Tesseract.js 7
- **PDF**: @react-pdf/renderer 4
- **Blob Storage**: @vercel/blob (untuk logo universitas, font)
- **Deployment**: Vercel (region: `sin1` — Singapore)
- **Font**: Space Grotesk (Google Fonts)

---

## Project Structure

```
NugAI/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Admin route group
│   │   ├── admin/
│   │   │   ├── analytics/        # Usage analytics dashboard
│   │   │   ├── providers/        # AI provider management (CRUD)
│   │   │   ├── search-providers/ # Search provider management (Tavily/Exa)
│   │   │   ├── users/            # User management + [id] detail
│   │   │   └── page.tsx          # Admin dashboard
│   │   └── layout.tsx            # Admin layout (Sidebar + InactivityGuard 30min)
│   ├── (auth)/                   # Auth route group (no sidebar)
│   │   ├── login/                # Login page
│   │   └── onboarding/           # Onboarding wizard (new user setup)
│   ├── (student)/                # Student route group
│   │   ├── courses/              # Course management (CRUD)
│   │   ├── dashboard/            # Student dashboard (quota, recent tasks)
│   │   ├── settings/             # Profile & password settings
│   │   ├── task/                 # Task management
│   │   │   ├── [id]/             # Task detail view (with AI provider & model labels)
│   │   │   ├── diskusi/new/      # New discussion task wizard
│   │   │   ├── soal/new/         # New assignment task wizard
│   │   │   ├── new/              # General new task
│   │   │   └── page.tsx          # Task list (cards with search, date filter & pagination)
│   │   └── layout.tsx            # Student layout (Sidebar + InactivityGuard 20min + ProfileGuard)
│   ├── api/                      # API Routes
│   │   ├── admin/                # Admin APIs (analytics, providers, users)
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── courses/              # Course CRUD API
│   │   ├── cron/                 # Cron jobs (cleanup, purge, reset quotas)
│   │   ├── generate-pdf/         # PDF generation endpoint
│   │   ├── generate-task/        # AI task generation (streaming)
│   │   ├── profile/              # Profile API
│   │   ├── quota/                # Quota check API
│   │   ├── regenerate/           # Task regeneration API
│   │   ├── tasks/                # Task CRUD API
│   │   └── user/                 # User operations (password, onboarding)
│   ├── globals.css               # Global styles (Tailwind)
│   ├── layout.tsx                # Root layout (SessionProvider, Toaster)
│   └── page.tsx                  # Landing page
├── components/
│   ├── auth/                     # LoginForm
│   ├── courses/                  # CourseCard, CourseList, CourseModal
│   ├── dashboard/                # QuickActions, QuotaDisplay, RecentTasks
│   ├── layout/                   # Sidebar, MobileNav, InactivityGuard, ProfileGuard
│   ├── onboarding/               # OnboardingWizard (Welcome, Profile, Course, Complete steps)
│   ├── settings/                 # PasswordForm, ProfileForm
│   ├── task/                     # TaskWizard (Step1Input, Step2Processing, Step3Result, OCRDropzone, PDFDownloadModal)
│   └── ui/                       # Reusable UI primitives (button, card, dialog, input, table, etc.)
├── hooks/
│   └── useInactivityLogout.ts    # Auto-logout hook (localStorage timestamp for mobile support)
├── lib/
│   ├── pdf/                      # PDF generation (font-loader, generator, styles)
│   ├── prompts/                  # AI prompt templates (task-generation, regeneration)
│   ├── types/                    # TypeScript type extensions (next-auth.d.ts)
│   ├── ai.ts                     # AI model creation & generation (multi-provider)
│   ├── ai-failover.ts            # AI provider failover with health tracking
│   ├── auth.ts                   # NextAuth configuration (Credentials + JWT, session includes name)
│   ├── course-colors.ts          # Course color utilities
│   ├── encryption.ts             # AES-256-GCM encryption for API keys
│   ├── ocr.ts                    # Tesseract.js OCR processing
│   ├── prisma.ts                 # Prisma client singleton
│   ├── provider.ts               # AI provider CRUD operations
│   ├── search.ts                 # Web search (Tavily + Exa integration)
│   └── utils.ts                  # General utilities
├── prisma/
│   ├── migrations/               # Database migrations
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Database seeder
├── public/
│   ├── fonts/                    # Liberation Sans fonts (PDF fallback)
│   ├── apple-touch-icon.png      # Apple touch icon (180x180, circular)
│   ├── ut.png                    # Logo Universitas Terbuka (untuk cover page PDF)
│   ├── nugai-icon-192.png        # PWA icon 192x192 (circular)
│   └── nugai-icon-512.png        # PWA icon 512x512 (circular)
├── tests/
│   └── landing-page.spec.ts      # Playwright tests
├── docs/                         # Documentation (deployment, cron, testing)
├── .github/workflows/ci.yml      # CI pipeline
├── vercel.json                   # Vercel config (crons, regions, function limits)
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies & scripts
└── tsconfig.json                 # TypeScript configuration
```

---

## Database Schema (PostgreSQL + Prisma)

### Models

| Model | Deskripsi |
|-------|-----------|
| **User** | User account (ADMIN/USER), subscription tier (FREE/PREMIUM), weekly quota tracking, premium subscription duration (monthly/lifetime), admin login rate limiting |
| **StudentProfile** | Profil mahasiswa (nama, NIM, universitas, fakultas, prodi, logo URL, default settings) |
| **Course** | Mata kuliah per-user (nama, kode mata kuliah (opsional, khusus UT), buku modul, nama tutor) |
| **TaskSession** | Sesi pembuatan tugas (tipe, target kata, AI provider tracking, course snapshot termasuk course_code, task_description_snapshot, answer_style) |
| **TaskItem** | Item soal/jawaban per sesi (question, answer, references, status, regenerate count) |
| **DailyUsageLog** | Log penggunaan harian (tokens, search calls, estimated cost, provider info) |
| **DataPurgeLog** | Audit trail untuk data purging |
| **AIProvider** | Konfigurasi AI provider (DeepSeek, OpenAI, Groq, Together, Custom) — admin managed |
| **SearchProvider** | Konfigurasi search provider (Tavily, Exa) — admin managed |

### Enums

- `UserRole`: ADMIN, USER
- `SubscriptionTier`: FREE, PREMIUM
- `TaskType`: DISCUSSION, ASSIGNMENT
- `TaskItemStatus`: GENERATING, COMPLETED, FAILED, DRAFT
- `ReferenceType`: MODULE, JOURNAL, BOOK, GOVERNMENT, WEB
- `AIProviderType`: DEEPSEEK, OPENAI, GROQ, TOGETHER, CUSTOM
- `SearchProviderType`: TAVILY, EXA

---

## Key Features & Architecture

### 1. AI Task Generation
- Multi-provider support dengan failover otomatis (health tracking, cooldown 60s, max 3 consecutive failures)
- Provider: DeepSeek, OpenAI, Groq, Together AI, Custom (OpenAI-compatible)
- Auto-redirect DeepSeek reasoning models (`deepseek-reasoner`, `deepseek-r1`) ke `deepseek-chat`
- Streaming response via Vercel AI SDK
- Prompt engineering khusus Bahasa Indonesia akademik
- Deteksi otomatis soal matematika → format penyelesaian bertahap
- **Answer Style Settings**: 4 opsi gaya jawaban (Paragraf, Poin/Numbering, Langkah Matematika, Kombinasi) — dipilih user di Step 1, disimpan di DB, digunakan sebagai instruksi AI prompt. Juga tersedia saat regenerate jawaban di Step 3 (user bisa ubah gaya & panjang jawaban saat revisi)
- **AI Preamble Stripping**: sanitizeAnswer() menghapus kalimat pembuka/konfirmasi AI (misal "Baik, berikut jawaban...") + strip markdown bold/italic formatting marks
- Prompt regenerasi melarang AI menulis preamble/konfirmasi
- **Regenerate UI**: Saat klik regenerate, muncul pilihan Panjang Jawaban & Gaya Jawaban + textarea instruksi opsional. Parameter dikirim ke API regenerate untuk override style jawaban

### 2. Web Search (Referensi)
- Tavily API: General & advanced web search
- Exa API: Academic-focused search
- Hasil search di-inject ke prompt sebagai konteks referensi
- Encrypted API keys (AES-256-GCM) di database

### 3. OCR (Optical Character Recognition)
- Tesseract.js 7 (client-side)
- Support bahasa Indonesia + English (`ind+eng`)
- Upload gambar soal → ekstrak teks otomatis

### 4. PDF Export
- @react-pdf/renderer (server-side)
- Cover page dengan logo universitas
- **Cover page khusus Universitas Terbuka**: Layout sesuai template UT (sesi tutorial, kode mata kuliah, logo UT, identitas mahasiswa, program studi, fakultas, UPBJJ)
- Modal download PDF: pilihan dengan/tanpa cover (khusus user UT) + input nomor sesi
- **Switch deskripsi di PDF**: Toggle untuk menyertakan/mengecualikan deskripsi soal dari PDF (hanya untuk ASSIGNMENT). Default ON. Tersedia di Step3Result dan halaman detail task
- **Formatted text rendering**: renderFormattedText() parser yang mendukung numbered lists, sub-items, section headers (Diketahui/Ditanyakan/Penyelesaian/Kesimpulan), dan paragraf — menggantikan plain text rendering
- Liberation Sans fonts (fallback)
- Support custom font upload per user

### 5. Authentication & Security
- NextAuth v5 dengan Credentials provider
- JWT session strategy
- Admin login rate limiting (lock setelah 5 failed attempts, 15 menit)
- Inactivity auto-logout (20 menit student, 30 menit admin)
- ProfileGuard: redirect ke onboarding jika profil belum lengkap
- API key encryption: AES-256-GCM

### 6. Quota System
- FREE tier: 3 generate + 3 regenerate per minggu
- PREMIUM tier: Unlimited (monthly subscription atau lifetime)
- Auto-reset mingguan (setiap Senin UTC) via logika `week_start_date`
- Auto-expire premium subscription via cron job (`/api/cron/reset-quotas`)
- Per-item regenerate limit: FREE = max 5x, PREMIUM = max 15x
- Admin bisa set durasi premium (bulan) atau lifetime via dashboard

### 7. Cron Jobs (Vercel Cron)

| Path | Schedule | Fungsi |
|------|----------|--------|
| `/api/cron/purge-data` | Monthly (1st, 00:00) | Purge data lama |
| `/api/cron/cleanup-temp-blobs` | Daily (03:00) | Cleanup temporary blob storage |
| `/api/cron/reset-quotas` | Daily (00:00) | Reset weekly usage quotas + auto-expire premium subscriptions |

---

## Environment Variables

| Variable | Deskripsi |
|----------|-----------|
| `NEXTAUTH_SECRET` | JWT signing secret (min 32 chars) |
| `NEXTAUTH_URL` | Base URL aplikasi |
| `DATABASE_URL` | PostgreSQL connection string |
| `API_KEY_ENCRYPTION_KEY` | AES-256 key (64 hex chars) untuk enkripsi API keys |

> AI & Search API keys dikonfigurasi melalui admin dashboard, bukan environment variables.

---

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript type checking
npm run db:generate  # Prisma generate client
npm run db:migrate   # Prisma migrate dev
npm run db:push      # Prisma db push
npm run db:seed      # Seed database
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Tailwind CSS 4, Radix UI, Lucide Icons |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Auth | NextAuth v5 (JWT + Credentials) |
| Database | PostgreSQL + Prisma ORM |
| AI | Vercel AI SDK v6 (DeepSeek, OpenAI, Groq, Together) |
| Search | Tavily API, Exa API |
| OCR | Tesseract.js 7 |
| PDF | @react-pdf/renderer |
| Storage | Vercel Blob |
| Deployment | Vercel (Singapore region) |
| CI | GitHub Actions |
| Testing | Playwright |
| Notifications | Sonner (toast) |
| Validation | Zod v4 |
