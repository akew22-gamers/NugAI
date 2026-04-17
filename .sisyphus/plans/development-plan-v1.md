# NugAI Development Plan - Ultrawork Execution Strategy

## Executive Summary

Plan comprehensive untuk implementasi NugAI - AI-powered academic task generator dari documentation-only ke production deployment. Plan mengikuti TDD principles dengan atomic commits, clear validation milestones, dan risk mitigation strategies aligned dengan PRD v2.0 specifications.

**Total Estimated Time:** 19-25 days

---

## Phase Overview

| Phase | Focus | Duration | Dependencies |
|-------|-------|----------|--------------|
| 0 | Project Setup & Configuration | 1-2 days | None |
| 1 | Database & Authentication Foundation | 3-4 days | Phase 0 |
| 2 | Core Student Features | 4-5 days | Phase 1 |
| 3 | AI Integration & Task Generation (Multi-Provider) | 6-7 days | Phase 2 |
| 4 | PDF Generation & Templates | 3-4 days | Phase 3 |
| 5 | Admin Dashboard (Provider Management) | 4-5 days | Phase 3 |
| 6 | Cron Jobs & Data Retention | 2-3 days | Phase 5 |
| 7 | Testing & Deployment | 2-3 days | All Phases |

---

## PHASE 0: Project Setup & Configuration
**Estimated Time:** 1-2 days

### Tasks

1. **Initialize Next.js 15+ App Router Project**
   ```bash
   npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir
   ```
   - Install dependencies:
     - `@prisma/client`, `next-auth`, `@react-pdf/renderer`
     - `ai`, `@ai-sdk/openai` (OpenAI-compatible provider support)
     - `@vercel/blob`
     - `tesseract.js`, `sonner`, `zod`
     - `bcryptjs`, `@upstash/ratelimit`
     - `crypto` (built-in) for API key encryption

2. **Configure Development Environment**
    - `.env.local`: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
    - API_KEY_ENCRYPTION_KEY (32-byte key for encrypting provider keys)
    - Optional: DEEPSEEK_API_KEY, TAVILY_API_KEY, EXA_API_KEY (can be configured via Admin)
    - SENTRY_DSN, VERCEL_BLOB_READ_WRITE_TOKEN

3. **Setup Tooling & Quality Gates**
   - `eslint.config.js`, `prettier.config.js`
   - `jest.config.js` with React Testing Library
   - `.github/workflows/ci.yml` for CI pipeline

### Milestone Checkpoints
- ✅ `npm run dev` runs without errors
- ✅ TypeScript compilation passes
- ✅ All environment variables validated

---

## PHASE 1: Database & Authentication Foundation
**Estimated Time:** 3-4 days | **Dependencies:** Phase 0

### Tasks with Exact File Paths

1. **Implement Prisma Schema**
   - `/prisma/schema.prisma` - Convert DATABASE_SCHEMA.md
   - `/prisma/migrations/20250416_initial/migration.sql`
   - `/lib/prisma.ts` - Singleton Prisma client

2. **Configure NextAuth.js v5**
   - `/lib/auth.ts` - Auth.js config with CredentialsProvider
   - `/app/api/auth/[...nextauth]/route.ts`
   - `/middleware.ts` - Role-based route protection

3. **Create Authentication UI**
   - `/app/(auth)/login/page.tsx`
   - `/components/ui/auth/LoginForm.tsx`
   - `/components/ui/auth/ProtectedRoute.tsx`

4. **Seed Initial Data**
   - `/prisma/seed.ts` - Admin user, test accounts

### Milestone Checkpoints
- ✅ Database migration applies successfully
- ✅ Admin can log in
- ✅ Student login redirects to onboarding if profile missing
- ✅ Role-based middleware blocks unauthorized access

### Security Implementation
- Admin rate limiting: `admin_login_attempts`, 15min lock after 5 failures
- bcrypt password hashing
- JWT session management

---

## PHASE 2: Core Student Features
**Estimated Time:** 4-5 days | **Dependencies:** Phase 1

### Tasks with Exact File Paths

1. **Student Onboarding Flow**
   - `/app/(auth)/onboarding/page.tsx`
   - `/api/onboarding/route.ts`
   - `/components/onboarding/ProfileForm.tsx`
   - `/components/onboarding/FontUpload.tsx` (optional)

2. **Course Management**
   - `/app/(student)/courses/page.tsx`
   - `/api/courses/route.ts` (GET, POST, PATCH, DELETE)
   - `/components/courses/CourseForm.tsx`

3. **Student Dashboard**
   - `/app/(student)/dashboard/page.tsx`
   - `/components/dashboard/QuotaDisplay.tsx`
   - `/components/dashboard/RecentTasks.tsx`

4. **Settings & Profile Management**
   - `/app/(student)/settings/page.tsx`
   - `/api/profile/route.ts`
   - `/api/user/change-password/route.ts`

### Milestone Checkpoints
- ✅ Onboarding complete with all required fields
- ✅ Course CRUD operations work
- ✅ Dashboard shows correct quota status (resets midnight)
- ✅ Password change requires current password

### Critical Pattern
- Server-side `WHERE user_id = session.user.id` on all queries
- Quota reset logic: middleware check on first daily request

---

## PHASE 3: AI Integration & Task Generation
**Estimated Time:** 6-7 days | **Dependencies:** Phase 2

### Tasks with Exact File Paths

1. **Provider Configuration Infrastructure**
    - `/lib/encryption.ts` - API key encryption/decryption (AES-256-GCM)
    - `/lib/provider.ts` - AIProvider & SearchProvider management
    - `/api/admin/providers/route.ts` - Provider CRUD
    - `/api/admin/providers/fetch-models/route.ts` - Fetch models from provider endpoint
    - `/api/admin/search-providers/route.ts` - Search API configuration

2. **3-Step Task Wizard UI**
    - `/app/(student)/task/new/page.tsx`
    - `/components/task/Step1Input.tsx`
    - `/components/task/OCRDropzone.tsx`
    - `/components/task/Step2Processing.tsx`
    - `/components/task/Step3Result.tsx`

3. **AI Research Pipeline (Multi-Provider)**
    - `/lib/ai.ts` - OpenAI-compatible provider integration (dynamic base_url, api_key, model)
    - `/lib/search.ts` - Tavily + Exa dual search (admin-configured keys)
    - `/lib/ocr.ts` - Tesseract.js wrapper

4. **Task Generation API**
    - `/api/generate-task/route.ts` - Quota transaction, uses configured provider
    - `/api/regenerate/route.ts` - Max 5, counts quota

5. **Prompt Engineering**
    - `/lib/prompts/task-generation.ts`
    - `/lib/prompts/regeneration.ts`

### Milestone Checkpoints
- ✅ Admin can configure AI providers (preset or custom)
- ✅ Models fetched from provider endpoint and stored
- ✅ Admin can select default model
- ✅ Wizard flows through all 3 steps
- ✅ OCR processes images with >90% accuracy
- ✅ AI generates answers meeting word count using configured provider
- ✅ References include module + academic source
- ✅ Quota enforcement transactional

### Critical Pattern (Multi-Provider Integration)
```typescript
// Dynamic provider configuration
const provider = await prisma.aiProvider.findFirst({
  where: { is_active: true },
});

const decryptedKey = decryptApiKey(provider.api_key);

// OpenAI-compatible streaming
const result = await streamText({
  model: openai(provider.default_model, {
    baseUrl: provider.base_url,
    apiKey: decryptedKey,
  }),
  system: systemPrompt,
  prompt: userPrompt,
});
```

### Transactional quota check (unchanged)
```typescript
// Transactional quota check
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({ where: { id } });
  // Reset if different day
  if (user.last_usage_date !== today) {
    await tx.user.update({ data: { daily_usage_count: 0 } });
  }
  // Check limit
  if (user.subscription_tier === 'FREE' && user.daily_usage_count >= 5) {
    throw new Error('Quota exceeded');
  }
  // Proceed with generation...
});
```

---

## PHASE 4: PDF Generation & Templates
**Estimated Time:** 3-4 days | **Dependencies:** Phase 3

### Tasks with Exact File Paths

1. **PDF Template Components**
   - `/components/pdf/DiscussionTemplate.tsx` - Template A
   - `/components/pdf/AssignmentTemplate.tsx` - Template B
   - `/components/pdf/CoverPage.tsx`
   - `/components/pdf/ReferencesSection.tsx`

2. **Font Management**
   - `/public/fonts/Arial-*.ttf` - Default fonts
   - `/lib/pdf/font-loader.ts` - Dynamic Font.register()

3. **PDF Generation API**
   - `/api/generate-pdf/route.ts`
   - `/lib/pdf/generator.ts` - renderToBuffer()

4. **PDF Download UI**
   - `/components/task/PDFPreview.tsx`
   - `/components/task/DownloadButton.tsx`

### Milestone Checkpoints
- ✅ PDF renders with correct font
- ✅ Template A: continuous document
- ✅ Template B: cover → question list → answers
- ✅ Margins 2.5cm, font 12pt, line height 1.15

### Critical Pattern (from Context7)
```typescript
// Font registration from URL
Font.register({
  family: 'Arial',
  fonts: [
    { src: fontUrl + 'Regular.ttf' },
    { src: fontUrl + 'Bold.ttf', fontWeight: 'bold' },
    { src: fontUrl + 'Italic.ttf', fontStyle: 'italic' },
  ],
});

// Server-side generation
const buffer = await renderToBuffer(<NugAIReport data={reportData} />);
```

---

## PHASE 5: Admin Dashboard
**Estimated Time:** 4-5 days | **Dependencies:** Phase 3

### Tasks with Exact File Paths

1. **Admin Dashboard Layout**
    - `/app/(admin)/admin/page.tsx`
    - `/app/(admin)/admin/users/page.tsx`
    - `/app/(admin)/admin/providers/page.tsx` - AI Provider configuration
    - `/app/(admin)/admin/search-providers/page.tsx` - Search API configuration
    - `/app/(admin)/admin/analytics/page.tsx`

2. **User Management**
    - `/api/admin/users/route.ts`
    - `/components/admin/UserManagement.tsx`
    - `/components/admin/CreateUserModal.tsx`

3. **AI Provider Configuration UI**
    - `/components/admin/AIProviderConfig.tsx` - Provider list and management
    - `/components/admin/ProviderForm.tsx` - Add/Edit provider form
    - `/components/admin/ModelSelector.tsx` - Model selection dropdown
    - `/api/admin/providers/route.ts` - Provider CRUD
    - `/api/admin/providers/fetch-models/route.ts` - External API to fetch models

4. **Search Provider Configuration UI**
    - `/components/admin/SearchProviderConfig.tsx` - Tavily/Exa config cards
    - `/api/admin/search-providers/route.ts`

5. **Analytics & Monitoring**
    - `/api/admin/analytics/route.ts`
    - `/components/admin/AnalyticsDashboard.tsx`
    - `/api/admin/system-health/route.ts`

6. **Admin Security**
    - Rate limiting: 5 attempts, 15min lock
    - Audit logging for all actions

### Milestone Checkpoints
- ✅ Admin can CRUD users
- ✅ Admin can configure AI providers (preset/custom)
- ✅ Models fetched from provider and selectable
- ✅ Admin can configure search APIs (Tavily/Exa)
- ✅ Subscription tier changes immediate
- ✅ Analytics shows accurate usage per provider
- ✅ System health monitors external APIs
- ✅ Login rate limiting prevents brute force

### Provider Configuration Flow
```typescript
// Admin creates provider
1. Admin selects provider type (DEEPSEEK/OPENAI/GROQ/TOGETHER/CUSTOM)
2. If preset → auto-fill base_url
3. Admin enters API key (encrypted on save)
4. System calls {base_url}/models endpoint
5. Models displayed in dropdown
6. Admin selects default model
7. Provider saved with is_active=true
```

---

## PHASE 6: Cron Jobs & Data Retention
**Estimated Time:** 2-3 days | **Dependencies:** Phase 5

### Tasks with Exact File Paths

1. **Data Purge Cron**
   - `/api/cron/purge-data/route.ts`
   - Logic: TaskSession >12 months, no newer sessions
   - Audit: DataPurgeLog with username_snapshot

2. **Blob Cleanup Cron**
   - `/api/cron/cleanup-temp-blobs/route.ts`
   - Logic: Delete temp-ocr blobs >24 hours

3. **Vercel Configuration**
   - `vercel.json`:
     ```json
     "crons": [
       {"path": "/api/cron/purge-data", "schedule": "0 0 1 * *"},
       {"path": "/api/cron/cleanup-temp-blobs", "schedule": "0 3 * * *"}
     ]
     ```

4. **In-App Notification**
   - `/components/dashboard/PurgeWarningBanner.tsx`
   - Warning 1 month before deletion

### Milestone Checkpoints
- ✅ Cron jobs execute on schedule
- ✅ Data purge identifies inactive users
- ✅ Audit trail preserved
- ✅ Warning banner appears before deletion

---

## PHASE 7: Testing & Deployment
**Estimated Time:** 2-3 days | **Dependencies:** All Phases

### Tasks

1. **Comprehensive Test Suite**
   - `/__tests__/unit/` - Utilities, validation
   - `/__tests__/integration/` - API endpoints
   - `/__tests__/e2e/` - Playwright tests

2. **Performance Optimization**
   - Verify indexes from schema
   - Response caching for static data
   - Code splitting for large components

3. **Security Hardening**
   - `sentry.client.config.ts`, `sentry.server.config.ts`
   - CSP headers, HSTS, security headers

4. **Production Deployment**
   - Vercel project setup
   - Database migration
   - Monitoring alerts

### Milestone Checkpoints
- ✅ Test coverage >80% critical paths
- ✅ Performance: Page load <2s, PDF <5s
- ✅ Security: No vulnerabilities
- ✅ Production deployed

---

## Commit Strategy

### Convention
- `feat(scope):` - New feature
- `fix(scope):` - Bug fix
- `chore(deps):` - Maintenance
- `refactor(scope):` - Code restructuring
- `test(scope):` - Tests
- `docs:` - Documentation

### Examples
```
feat(auth): implement NextAuth.js v5 with credential provider
fix(task): quota calculation off-by-one error
chore(deps): update prisma to 5.8.0
test(api): add integration tests for generate-task
```

---

## Dependency Graph

```
Phase 0 (Setup) → Phase 1 (DB+Auth) → Phase 2 (Student)
    → Phase 3 (AI Generation) → Phase 4 (PDF) → Phase 5 (Admin)
    → Phase 6 (Cron) → Phase 7 (Deploy)
```

**Critical Path:** Phase 1 → Phase 2 → Phase 3 (AI Generation is core value)

---

## Risk Register

| Risk | Impact | Mitigation | Phase |
|------|--------|------------|-------|
| API key exposure | Critical | Server-side only, env vars | 3 |
| Quota bypass | High | Transactional enforcement | 3 |
| Cross-user data leak | Critical | WHERE user_id check | 2 |
| PDF generation fail | Medium | Fallback fonts, retry | 4 |
| Cost overruns | High | Usage caps, alerts | 3,5 |
| LLM hallucination | Medium | Reference validation | 3 |

---

## Success Metrics

### Technical
- Uptime: >99.5%
- Performance: <2s page load, <5s PDF, <200ms API
- Task generation success: >95%
- Test coverage: >80%

### Business
- Onboarding completion: >90%
- Generation time: <60s average
- PDF quality: >95% meet standards

---

**Plan Version:** 2.0 (Multi-Provider Architecture)
**Created:** April 16, 2026
**Updated:** April 2026
**Status:** Ready for Execution
**Total Duration:** 22-28 days (increased for provider management)

**Changes from v1.0:**
- Added multi-provider AI architecture (OpenAI-compatible)
- Added preset providers: DeepSeek, OpenAI, Groq, Together AI, Custom
- Added AIProvider and SearchProvider configuration in Phase 3
- Added provider management UI in Phase 5
- Added API key encryption infrastructure
- Updated Phase 3 duration (5-6 → 6-7 days)
- Updated Phase 5 duration (3-4 → 4-5 days)
- Changed from @ai-sdk/deepseek to @ai-sdk/openai (OpenAI-compatible)
- Added API_KEY_ENCRYPTION_KEY environment variable