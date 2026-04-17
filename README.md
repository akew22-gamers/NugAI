# NugAI - AI-Powered Academic Task Assistant

[![Build Status](https://github.com/your-username/NugAI/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/NugAI/actions)
[![License](https://img.shields.io/badge/license-proprietary-blue.svg)](LICENSE)

NugAI (Nugas sama AI) adalah aplikasi web yang dirancang untuk mengotomatisasi penyusunan jawaban tugas akademik (Tugas Diskusi & Tugas Soal) mahasiswa dengan bantuan AI, pencarian referensi real-time, dan format PDF siap kumpul.

**Developer**: EAS Creative Studio  
**Website**: [eas.biz.id](https://eas.biz.id)  
**Version**: 1.0.0

---

## Features ✨

### Student Features
-  **3-Step Task Wizard** - Simple workflow: input → process → result
- 📝 **OCR Support** - Upload question images, auto-extract text
- 🎓 **Multi-Provider AI** - Support DeepSeek, OpenAI, Groq, Together AI
- 🔍 **Academic Search** - Integrated Tavily & Exa for credible references
- 📄 **PDF Export** - Professional formatting with custom fonts
- 🔄 **Regenerate** - Up to 5 times per answer
- 📊 **Quota Management** - FREE (5/day) vs PREMIUM (unlimited)

### Admin Features
- 👥 **User Management** - CRUD users, manage subscriptions
- 🔧 **Provider Configuration** - AI & Search providers dashboard
- 📈 **Analytics** - Usage stats, cost tracking, top users
- 💚 **System Health** - Monitor API status
- 🗑️ **Auto-Purge** - 12-month data retention with cron jobs

---

## Tech Stack 🛠

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15+ App Router |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui |
| **Database** | Vercel Postgres |
| **ORM** | Prisma |
| **Auth** | NextAuth.js v5 |
| **AI SDK** | Vercel AI SDK |
| **PDF** | @react-pdf/renderer |
| **OCR** | Tesseract.js |
| **Storage** | Vercel Blob |
| **Deployment** | Vercel Serverless |

---

## Quick Start 🚀

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org))
- npm or yarn
- Git
- Vercel account (for deployment)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/NugAI.git
cd NugAI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy example env file
cp .env.example .env.local

# Generate secrets
# NEXTAUTH_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -hex 32

# API_KEY_ENCRYPTION_KEY
openssl rand -hex 32
```

Edit `.env.local`:
```bash
# Authentication
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Database (local dev or Vercel Postgres)
DATABASE_URL="postgresql://user:password@localhost:5432/nugai"

# Cron Jobs
CRON_SECRET="your-cron-secret"

# Encryption (DO NOT CHANGE AFTER SETUP!)
API_KEY_ENCRYPTION_KEY="your-encryption-key"

# Storage (if using Vercel Blob)
VERCEL_BLOB_READ_WRITE_TOKEN="your-blob-token"

# Admin credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="ChangeMe123!"
```

### 4. Database Setup
```bash
# Initialize Prisma
npx prisma generate

# Run migration
npx prisma migrate dev

# (Optional) Seed initial data
# (Create admin user manually or add seed script)
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Login with admin credentials** you set in `.env.local`

---

## Documentation 📚

| Document | Description |
|----------|-------------|
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Step-by-step Vercel deployment |
| [PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) | Pre/Post deployment checklist |
| [CRON_JOBS.md](docs/CRON_JOBS.md) | Cron job configuration guide |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Database schema reference |
| [API_ENDPOINTS.md](API_ENDPOINTS.md) | API routes documentation |
| [USER_FLOW.md](USER_FLOW.md) | User journey documentation |
| [PRD_NugAI_Final.md](PRD_NugAI_Final.md) | Product requirements |

---

## Project Structure 📁

```
NugAI/
├── app/
│   ├── (admin)/           # Admin dashboard routes
│   │   └── admin/
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   └── onboarding/
│   ├── (student)/         # Student dashboard routes
│   │   ├── dashboard/
│   │   ├── task/
│   │   ├── courses/
│   │   └── settings/
│   ├── api/
│   │   ├── admin/         # Admin API routes
│   │   ├── auth/          # Auth routes
│   │   ├── cron/          # Cron job routes
│   │   └── ...            # Feature API routes
│   └── layout.tsx
├── components/
│   ├── admin/             # Admin components
│   ├── auth/              # Auth components
│   ├── courses/           # Course components
│   ├── layout/            # Layout components
│   ├── task/              # Task generator components
│   └── ui/                # Base UI components
├── lib/
│   ├── pdf/               # PDF generation
│   ├── prompts/           # AI prompts
│   ├── ai.ts              # AI integration
│   ├── auth.ts            # Auth config
│   ├── encryption.ts      # API key encryption
│   ├── provider.ts        # Provider management
│   ├── prisma.ts          # Prisma client
│   └── search.ts          # Search integration
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Migration files
│   └── seed.ts            # Seed data
├── docs/                  # Documentation
├── public/
│   └── fonts/             # PDF fonts
├── .github/workflows/     # CI/CD
└── vercel.json            # Vercel config
```

---

## Scripts 📝

```bash
# Development
npm run dev           # Start dev server

# Build
npm run build         # Production build
npm run start         # Start production server

# Quality
npm run lint          # ESLint check
npx tsc --noEmit      # TypeScript check

# Database
npx prisma generate   # Generate Prisma client
npx prisma migrate dev  # Development migration
npx prisma migrate deploy  # Production migration
npx prisma studio     # Database GUI
```

---

## Deployment 🚀

### Vercel Deployment

1. **Push to GitHub**
```bash
git add .
git commit -m "feat: production ready"
git push origin main
```

2. **Connect to Vercel**
   - Visit: https://vercel.com/dashboard
   - Add New → Project → Import GitHub Repo

3. **Configure Environment Variables**
   - Add all required vars in Vercel
   - See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for details

4. **Deploy**
   - Click Deploy
   - Vercel handles the rest!

### Post-Deployment

1. **Run Migrations**
```bash
npx prisma migrate deploy --schema ./prisma/schema.prisma
```

2. **Create Admin User**
   - Use provided seed script or create via SQL

3. **Configure Providers**
   - Login as admin
   - Configure AI provider at `/admin/providers`
   - Configure search at `/admin/search-providers`

---

## Environment Variables 🔑

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgres://...` |
| `NEXTAUTH_SECRET` | JWT signing secret | `min 32 chars` |
| `NEXTAUTH_URL` | App URL | `http://localhost:3000` |
| `CRON_SECRET` | Cron job auth | `64 hex chars` |
| `API_KEY_ENCRYPTION_KEY` | API key encryption | `64 hex chars` |
| `VERCEL_BLOB_READ_WRITE_TOKEN` | Vercel Blob token | `vercel_blob_...` |

### Optional

- `SENTRY_DSN` - Sentry error tracking
- `DEEPSEEK_API_KEY` - Direct DeepSeek key (override dashboard)
- `TAVILY_API_KEY` - Direct Tavily key (override dashboard)
- `EXA_API_KEY` - Direct Exa key

---

## Security 🔒

- **Password Hashing**: bcrypt (cost 10)
- **API Key Encryption**: AES-256-GCM
- **Rate Limiting**: 5 attempts/15min for admin
- **Session Management**: JWT with NextAuth
- **Input Validation**: Zod schemas
- **XSS Protection**: React escaping built-in
- **HTTPS**: Enforced by Vercel

---

## Quota Limits 📊

| Tier | Daily Quota | Features |
|------|-------------|----------|
| FREE | 5 tasks/day | All core features |
| PREMIUM | Unlimited | Priority support, advanced features |

Quota resets daily at midnight UTC via cron job.

---

## Data Retention 🗄

- **Task Sessions**: Auto-purge after 12 months
- **PDF Downloads**: Available before purge
- **User Accounts**: Never auto-deleted
- **Temp Uploads**: Auto-delete after 24h

---

## License ⚖️

Proprietary - All rights reserved.  
© 2026 EAS Creative Studio

Unauthorized copying, distribution, or use is prohibited.

---

## Support 💬

- **Email**: support@eas.biz.id
- **Website**: [eas.biz.id](https://eas.biz.id)
- **Documentation**: See `/docs` folder

---

## Contributing 🤝

This is a private project. For contributions, please contact the development team.

---

## Acknowledgments 🙏

Built with:
- [Next.js](https://nextjs.org)
- [Vercel](https://vercel.com)
- [Prisma](https://prisma.io)
- [shadcn/ui](https://ui.shadcn.com)
- [Vercel AI SDK](https://sdk.vercel.ai)

---

**Made with ❤️ by EAS Creative Studio**