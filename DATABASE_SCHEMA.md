# Database Schema Documentation - NugAI

## Overview

Dokumen ini menjelaskan struktur database Prisma untuk NugAI, termasuk relasi, constraints, dan indexing strategy.

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ====================
// ENUM DEFINITIONS
// ====================

enum UserRole {
  ADMIN
  STUDENT
}

enum SubscriptionTier {
  FREE
  PREMIUM
}

enum TaskType {
  DISCUSSION  // Tugas Diskusi
  ASSIGNMENT  // Tugas Soal/Makalah
}

enum TaskItemStatus {
  GENERATING
  COMPLETED
  FAILED
  DRAFT      // Added: for "Save as Draft" functionality
}

enum ReferenceType {
  MODULE
  JOURNAL
  BOOK
  GOVERNMENT
  WEB
}

enum AIProviderType {
  DEEPSEEK
  OPENAI
  GROQ
  TOGETHER
  CUSTOM
}

enum SearchProviderType {
  TAVILY
  EXA
}

// ====================
// USER & AUTHENTICATION
// ====================

model User {
  id                String          @id @default(uuid())
  username          String          @unique @db.VarChar(50)
  password          String          @db.VarChar(255) // bcrypt hashed
  role              UserRole        @default(STUDENT)
  subscription_tier SubscriptionTier @default(FREE)
  daily_usage_count Int             @default(0)
  last_usage_date   DateTime?       @db.Date
  created_at        DateTime        @default(now())
  
  // Rate limiting fields for admin login protection
  admin_login_attempts Int          @default(0)
  admin_login_locked_until DateTime?
  
  // Relations
  student_profile   StudentProfile?
  courses           Course[]
  task_sessions     TaskSession[]
  usage_logs        DailyUsageLog[]
  
  @@index([role])
  @@index([subscription_tier])
  @@index([last_usage_date])
  @@map("users")
}

model StudentProfile {
  id                String  @id @default(uuid())
  user_id           String  @unique
  full_name         String  @db.VarChar(100)
  nim               String  @db.VarChar(20)
  university_name   String  @db.VarChar(100)
  faculty           String  @db.VarChar(50)
  study_program     String  @db.VarChar(50)
  upbjj_branch      String? @db.VarChar(50)
  university_logo_url String @db.VarChar(500) // Required - Vercel Blob URL
  default_min_words Int     @default(300)
  default_tone      String  @default("Bahasa Indonesia Baku Semi-Formal") @db.VarChar(100)
  pdf_font_url      String? @db.VarChar(500) // User-uploaded Arial font URL
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  // Relations
  user              User    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([university_name])
  @@index([study_program])
  @@map("student_profiles")
}

// ====================
// COURSES (Private per-user)
// ====================

model Course {
  id              String   @id @default(uuid())
  user_id         String
  course_name     String   @db.VarChar(100)
  module_book_title String @db.VarChar(200)
  tutor_name      String   @db.VarChar(100)
  created_at      DateTime @default(now())
  
  // Relations
  user            User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  task_sessions   TaskSession[]
  
  @@index([user_id])
  @@index([course_name])
  @@map("courses")
}

// ====================
// TASK SESSIONS & ITEMS
// ====================

model TaskSession {
  id                String     @id @default(uuid())
  user_id           String
  course_id         String?    // Nullable if manual input
  task_type         TaskType
  min_words_target  Int
  regenerate_count  Int        @default(0) // Total regenerates for this session
  created_at        DateTime   @default(now())
  
  // Snapshot fields for course data (preserve for PDF generation if course deleted)
  course_name_snapshot        String?  @db.VarChar(100)
  module_book_title_snapshot  String?  @db.VarChar(200)
  tutor_name_snapshot         String?  @db.VarChar(100)
  
  // Relations
  user              User       @relation(fields: [user_id], references: [id], onDelete: Cascade)
  course            Course?    @relation(fields: [course_id], references: [id], onDelete: SetNull)
  task_items        TaskItem[]
  usage_logs        DailyUsageLog[]
  
  @@index([user_id])
  @@index([task_type])
  @@index([created_at])
  @@index([user_id, created_at])  // Added: Composite index for user session timeline
  @@index([course_id, created_at]) // Added: Composite index for course usage analytics
  @@map("task_sessions")
}

model TaskItem {
  id              String         @id @default(uuid())
  session_id      String
  question_text   String         @db.Text
  answer_text     String?        @db.Text
  references_used Json?          // Polymorphic structure (see ReferenceType)
  regenerate_count Int           @default(0) // Max: 5, counts toward daily quota
  status          TaskItemStatus @default(GENERATING)
  created_at      DateTime       @default(now())
  
  // Relations
  session         TaskSession    @relation(fields: [session_id], references: [id], onDelete: Cascade)
  
  @@index([session_id])
  @@index([status])
  @@index([session_id, status])   // Added: Composite index for session item status check
  @@map("task_items")
}

// ====================
// API USAGE TRACKING
// ====================

model DailyUsageLog {
  id                  String   @id @default(uuid())
  user_id             String
  session_id          String
  deepseek_tokens_used Int?
  tavily_calls        Int      @default(0)
  exa_calls           Int      @default(0)
  estimated_cost      Decimal? @db.Decimal(10, 4) // USD
  date                DateTime @db.Date
  created_at          DateTime @default(now())
  
  // Relations
  user                User        @relation(fields: [user_id], references: [id], onDelete: Cascade)
  session             TaskSession @relation(fields: [session_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@index([date])
  @@index([user_id, date])
  @@map("daily_usage_logs")
}

// ====================
// DATA RETENTION AUDIT
// ====================

model DataPurgeLog {
  id              String   @id @default(uuid())
  user_id         String   // Changed: Non-nullable to preserve audit trail (store before user deletion)
  username_snapshot String  @db.VarChar(50)  // Added: Store username for audit
  sessions_purged Int
  items_purged    Int
  purge_date      DateTime @default(now())
  reason          String   @db.VarChar(200)
  
  @@index([purge_date])
  @@index([user_id])
  @@map("data_purge_logs")
}

// ====================
// AI PROVIDER CONFIGURATION
// ====================

model AIProvider {
  id                String         @id @default(uuid())
  provider_type     AIProviderType
  provider_name     String         @db.VarChar(50)      // Display name: "DeepSeek", "OpenAI", etc.
  base_url          String         @db.VarChar(200)     // OpenAI-compatible API base URL
  api_key           String         @db.VarChar(255)     // Encrypted API key
  available_models  Json?                               // Fetched models from provider endpoint
  default_model     String         @db.VarChar(100)     // Selected default model ID
  is_active         Boolean        @default(true)
  last_model_fetch  DateTime?
  created_at        DateTime       @default(now())
  updated_at        DateTime       @updatedAt
  
  @@index([provider_type])
  @@index([is_active])
  @@map("ai_providers")
}

model SearchProvider {
  id            String             @id @default(uuid())
  provider_type SearchProviderType
  api_key       String             @db.VarChar(255)     // Encrypted API key
  is_active     Boolean            @default(true)
  created_at    DateTime           @default(now())
  updated_at    DateTime           @updatedAt
  
  @@unique([provider_type])        // Only one config per provider type
  @@map("search_providers")
}
```

---

## Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              NUGAI DATABASE ERD                                  │
│                              Version 3.0 (Multi-Provider)                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐       1:1        ┌─────────────────────┐
│    User      │──────────────────│   StudentProfile    │
├──────────────┤                  ├─────────────────────┤
│ id (PK)      │                  │ id (PK)             │
│ username     │                  │ user_id (FK, UK)    │
│ password     │                  │ full_name           │
│ role         │                  │ nim                 │
│ subscription │                  │ university_name     │
│ daily_usage  │                  │ faculty             │
│ last_usage   │                  │ study_program       │
│ admin_login  │◄─ Rate Limit     │ upbjj_branch        │
│  attempts    │                  │ university_logo_url │
│ admin_login  │◄─ Rate Limit     │ default_min_words   │
│ locked_until │                  │ default_tone        │
│ created_at   │                  │ pdf_font_url (OPT)  │
└──────┬───────┘                  └─────────────────────┘
       │
       │ 1:N
       │
       ├──────────────────────────┬──────────────────────┐
       │                          │                      │
       ▼                          ▼                      ▼
┌──────────────┐           ┌─────────────────────┐  ┌─────────────────────┐
│   Course     │           │   TaskSession       │  │   DailyUsageLog     │
├──────────────┤           ├─────────────────────┤  ├─────────────────────┤
│ id (PK)      │           │ id (PK)             │  │ id (PK)             │
│ user_id (FK) │           │ user_id (FK)        │  │ user_id (FK)        │
│ course_name  │           │ course_id (FK, N)   │  │ session_id (FK)     │
│ module_title │           │ task_type           │  │ llm_tokens_used ◄───│◄─ Changed
│ tutor_name   │           │ min_words_target    │  │ tavily_calls        │
│ created_at   │           │ regenerate_count    │  │ exa_calls           │
└──────┬───────┘           │ course_name_snap ◄──│◄─ Snapshot           │
       │                   │ module_title_snap ◄─│◄─ Snapshot           │
       │ 1:N               │ tutor_name_snap   ◄─│◄─ Snapshot           │
       │                   │ created_at          │  │ estimated_cost      │
       │                   └──────────┬──────────┘  │ date                │
       │                              │             │ created_at          │
       │                              │ 1:N         └─────────────────────┘
       │                              │
       │                              ▼
       │                   ┌─────────────────────┐
       └                   │    TaskItem         │
       │                   ├─────────────────────┤
       │                   │ id (PK)             │
       │                   │ session_id (FK)     │
       │                   │ question_text       │
       │                   │ answer_text         │
       │                   │ references_used (J) │
       │                   │ regenerate_count    │
       │                   │ status (incl.DRAFT) │◄─ DRAFT status
       │                   │ created_at          │
       │                   └─────────────────────┘
       │
       └───────────────────────────────────────────┐
                                                   │
                                                   ▼
                                    ┌─────────────────────┐
                                    │   DataPurgeLog      │
                                    ├─────────────────────┤
                                    │ id (PK)             │
                                    │ user_id (FK, REQ)   │◄─ Required
                                    │ username_snapshot   │◄─ NEW
                                    │ sessions_purged     │
                                    │ items_purged        │
                                    │ purge_date          │
                                    │ reason              │
                                    └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PROVIDER CONFIGURATION (Admin Only)                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐           ┌─────────────────────┐
│    AIProvider       │           │   SearchProvider    │
├─────────────────────┤           ├─────────────────────┤
│ id (PK)             │           │ id (PK)             │
│ provider_type (E)   │◄─ DEEPSEEK│ provider_type (E)   │◄─ TAVILY/EXA
│ provider_name       │   OPENAI  │ api_key (ENC)       │◄─ Encrypted
│ base_url            │   GROQ    │ is_active           │
│ api_key (ENC)       │◄─ Encrypted│ created_at          │
│ available_models (J)│   TOGETHER│ updated_at          │
│ default_model       │   CUSTOM  │                     │
│ is_active           │           │ @@unique(provider)  │◄─ One per type
│ last_model_fetch    │           └─────────────────────┘
│ created_at          │
│ updated_at          │
│                     │
│ @@index(provider)   │
│ @@index(is_active)  │
└─────────────────────┘

Legend:
PK  = Primary Key
FK  = Foreign Key
UK  = Unique Key
N   = Nullable
REQ = Required (Non-Nullable)
OPT = Optional (Nullable)
J   = JSON Field
E   = Enum Field
ENC = Encrypted Field
NEW = New Field
1:1 = One-to-One Relation
1:N = One-to-Many Relation
```

---

## JSON Schema: references_used

### Structure Definition

```typescript
// TypeScript interface for references_used
interface ReferenceBase {
  source: 'user_input' | 'exa_search' | 'tavily_search' | 'scraper';
}

interface ModuleReference extends ReferenceBase {
  type: 'module';
  title: string;       // Judul Modul/Buku
  author: string;      // Nama Penulis/Tutor
  year: string;        // Tahun Terbit
  publisher: string;   // Penerbit
  source: 'user_input';
}

interface JournalReference extends ReferenceBase {
  type: 'journal';
  title: string;           // Judul Artikel
  authors: string[];       // Array penulis
  journal_name: string;    // Nama Jurnal
  year: string;
  volume: string;
  issue: string;
  pages: string;           // "123-145"
  url?: string;
  doi?: string;
  source: 'exa_search' | 'tavily_search';
}

interface BookReference extends ReferenceBase {
  type: 'book';
  title: string;
  authors: string[];
  year: string;
  publisher: string;
  isbn?: string;
  url?: string;
  source: 'exa_search' | 'tavily_search';
}

interface GovernmentReference extends ReferenceBase {
  type: 'government';
  title: string;           // "Undang-Undang Republik Indonesia..."
  number: string;          // "UU No. 20 Tahun 2003"
  year: string;
  institution: string;     // "Kementerian Pendidikan..."
  url?: string;
  source: 'tavily_search' | 'exa_search';
}

interface WebReference extends ReferenceBase {
  type: 'web';
  title: string;
  url: string;
  site_name: string;
  published_date?: string;
  authors?: string[];
  source: 'tavily_search' | 'scraper';
}

// Union type for all reference types
type Reference = ModuleReference | JournalReference | BookReference | GovernmentReference | WebReference;

// references_used field structure
interface ReferencesUsed {
  references: Reference[];
  search_metadata?: {
    tavily_query?: string;
    exa_query?: string;
    search_timestamp: string;
    total_results_found: number;
  };
}
```

### Example Data

```json
{
  "references": [
    {
      "type": "module",
      "title": "Modul Pengantar Ilmu Ekonomi",
      "author": "Dr. Ahmad Yusuf",
      "year": "2024",
      "publisher": "Universitas Terbuka",
      "source": "user_input"
    },
    {
      "type": "journal",
      "title": "Pengaruh Inflasi terhadap Pertumbuhan Ekonomi di Indonesia",
      "authors": ["Siti Rahayu", "Budi Santoso"],
      "journal_name": "Jurnal Ekonomi Pembangunan",
      "year": "2023",
      "volume": "8",
      "issue": "2",
      "pages": "145-167",
      "url": "https://jurnal.example.org/article/123",
      "doi": "10.1234/jep.v8i2.123",
      "source": "exa_search"
    }
  ],
  "search_metadata": {
    "tavily_query": "inflasi pertumbuhan ekonomi indonesia",
    "exa_query": "jurnal ekonomi inflasi indonesia 2023",
    "search_timestamp": "2026-04-16T10:30:00Z",
    "total_results_found": 15
  }
}
```

---

## Indexing Strategy

### Primary Indexes (Already defined in schema)

| Table | Index | Purpose |
|-------|-------|---------|
| User | `role` | Filter by role (ADMIN/STUDENT) |
| User | `subscription_tier` | Filter by subscription |
| User | `last_usage_date` | Quota reset check |
| StudentProfile | `university_name` | Analytics grouping |
| StudentProfile | `study_program` | Analytics grouping |
| AIProvider | `provider_type` | Filter by provider type |
| AIProvider | `is_active` | Filter active providers |
| SearchProvider | `provider_type (unique)` | One config per provider type |
| Course | `user_id` | User's course list |
| Course | `course_name` | Search courses |
| TaskSession | `user_id` | User's session list |
| TaskSession | `task_type` | Filter by type |
| TaskSession | `created_at` | Date range queries |
| TaskItem | `session_id` | Session's items |
| TaskItem | `status` | Filter by status |
| DailyUsageLog | `user_id` | User usage history |
| DailyUsageLog | `date` | Daily aggregation |
| DailyUsageLog | `user_id, date` | Composite: user daily usage |

### Additional Performance Indexes (Implemented)

The following composite indexes have been added to the schema for optimized query performance:

| Table | Composite Index | Purpose |
|-------|-----------------|---------|
| TaskSession | `(user_id, created_at)` | User session timeline queries |
| TaskSession | `(course_id, created_at)` | Course usage analytics |
| TaskItem | `(session_id, status)` | Session item status filtering |
| DataPurgeLog | `(user_id)` | Audit trail per user |

These indexes support the most common query patterns identified in the application flow.

---

## Migration History

### Migration 001: Initial Schema

```sql
-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "subscription_tier" TEXT NOT NULL DEFAULT 'FREE',
    "daily_usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_usage_date" DATE,
    "admin_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "admin_login_locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_subscription_tier_idx" ON "users"("subscription_tier");
CREATE INDEX "users_last_usage_date_idx" ON "users"("last_usage_date");

-- CreateTable: StudentProfile
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "nim" VARCHAR(20) NOT NULL,
    "university_name" VARCHAR(100) NOT NULL,
    "faculty" VARCHAR(50) NOT NULL,
    "study_program" VARCHAR(50) NOT NULL,
    "upbjj_branch" VARCHAR(50),
    "university_logo_url" VARCHAR(500) NOT NULL,
    "default_min_words" INTEGER NOT NULL DEFAULT 300,
    "default_tone" VARCHAR(100) NOT NULL DEFAULT 'Bahasa Indonesia Baku Semi-Formal',
    "pdf_font_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");
CREATE INDEX "student_profiles_university_name_idx" ON "student_profiles"("university_name");
CREATE INDEX "student_profiles_study_program_idx" ON "student_profiles"("study_program");

-- CreateTable: Course
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_name" VARCHAR(100) NOT NULL,
    "module_book_title" VARCHAR(200) NOT NULL,
    "tutor_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "courses_user_id_idx" ON "courses"("user_id");
CREATE INDEX "courses_course_name_idx" ON "courses"("course_name");

-- CreateTable: TaskSession
CREATE TABLE "task_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT,
    "task_type" TEXT NOT NULL,
    "min_words_target" INTEGER NOT NULL,
    "regenerate_count" INTEGER NOT NULL DEFAULT 0,
    "course_name_snapshot" VARCHAR(100),
    "module_book_title_snapshot" VARCHAR(200),
    "tutor_name_snapshot" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "task_sessions_user_id_idx" ON "task_sessions"("user_id");
CREATE INDEX "task_sessions_task_type_idx" ON "task_sessions"("task_type");
CREATE INDEX "task_sessions_created_at_idx" ON "task_sessions"("created_at");
CREATE INDEX "task_sessions_user_id_created_at_idx" ON "task_sessions"("user_id", "created_at");
CREATE INDEX "task_sessions_course_id_created_at_idx" ON "task_sessions"("course_id", "created_at");

-- CreateTable: TaskItem
CREATE TABLE "task_items" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer_text" TEXT,
    "references_used" JSONB,
    "regenerate_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'GENERATING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "task_items_session_id_idx" ON "task_items"("session_id");
CREATE INDEX "task_items_status_idx" ON "task_items"("status");
CREATE INDEX "task_items_session_id_status_idx" ON "task_items"("session_id", "status");

-- CreateTable: DailyUsageLog
CREATE TABLE "daily_usage_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "deepseek_tokens_used" INTEGER,
    "tavily_calls" INTEGER NOT NULL DEFAULT 0,
    "exa_calls" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost" DECIMAL(10,4),
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "daily_usage_logs_user_id_idx" ON "daily_usage_logs"("user_id");
CREATE INDEX "daily_usage_logs_date_idx" ON "daily_usage_logs"("date");
CREATE INDEX "daily_usage_logs_user_id_date_idx" ON "daily_usage_logs"("user_id", "date");

-- CreateTable: DataPurgeLog
CREATE TABLE "data_purge_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username_snapshot" VARCHAR(50) NOT NULL,
    "sessions_purged" INTEGER NOT NULL,
    "items_purged" INTEGER NOT NULL,
    "purge_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" VARCHAR(200) NOT NULL,
    CONSTRAINT "data_purge_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "data_purge_logs_purge_date_idx" ON "data_purge_logs"("purge_date");
CREATE INDEX "data_purge_logs_user_id_idx" ON "data_purge_logs"("user_id");

-- Add Foreign Key Constraints
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "courses" ADD CONSTRAINT "courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_sessions" ADD CONSTRAINT "task_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_sessions" ADD CONSTRAINT "task_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "task_items" ADD CONSTRAINT "task_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "task_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_usage_logs" ADD CONSTRAINT "daily_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_usage_logs" ADD CONSTRAINT "daily_usage_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "task_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Query Patterns & Examples

### 1. User Authentication Check

```typescript
// Check user with student profile
const user = await prisma.user.findUnique({
  where: { username },
  include: {
    student_profile: true,
  },
});
```

### 2. Daily Quota Check (Server-Side Transactional)

```typescript
// Check if user can create new session - MUST be done in transaction
const today = new Date().toISOString().split('T')[0];

const canCreateSession = await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      subscription_tier: true,
      daily_usage_count: true,
      last_usage_date: true,
    },
  });

  // Reset quota if last usage was on a different day
  if (user.last_usage_date?.toISOString().split('T')[0] !== today) {
    await tx.user.update({
      where: { id: userId },
      data: {
        daily_usage_count: 0,
        last_usage_date: today,
      },
    });
    return true; // Quota reset, can proceed
  }

  // Check quota based on tier
  if (user.subscription_tier === 'PREMIUM') {
    return true; // Unlimited for Premium
  }

  return user.daily_usage_count < 5; // FREE tier: max 5 per day
});

// If canCreateSession is false, return error before proceeding
if (!canCreateSession) {
  throw new Error('Daily quota exceeded');
}
```

### 2b. Increment Quota on Session Creation

```typescript
// After session creation succeeds, increment quota atomically
await prisma.$transaction([
  prisma.user.update({
    where: { id: userId },
    data: {
      daily_usage_count: { increment: 1 },
      last_usage_date: today,
    },
  }),
  prisma.taskSession.create({
    data: {
      user_id: userId,
      course_id: courseId,
      // Copy course data to snapshot fields if course exists
      course_name_snapshot: course?.course_name,
      module_book_title_snapshot: course?.module_book_title,
      tutor_name_snapshot: course?.tutor_name,
      task_type: 'DISCUSSION',
      min_words_target: 300,
      task_items: {
        create: questions.map(q => ({
          question_text: q,
          status: 'GENERATING',
        })),
      },
    },
    include: {
      task_items: true,
    },
  }),
]);
```

### 3. Get User's Courses

```typescript
const courses = await prisma.course.findMany({
  where: { user_id: userId },
  orderBy: { created_at: 'desc' },
});
```

### 4. Create Task Session with Items (Including Snapshots)

```typescript
// First fetch course if course_id is provided
const course = courseId ? await prisma.course.findUnique({
  where: { id: courseId },
}) : null;

const session = await prisma.taskSession.create({
  data: {
    user_id: userId,
    course_id: courseId,
    // Snapshot fields - copy from course if exists
    course_name_snapshot: course?.course_name || null,
    module_book_title_snapshot: course?.module_book_title || null,
    tutor_name_snapshot: course?.tutor_name || null,
    task_type: 'DISCUSSION',
    min_words_target: 300,
    task_items: {
      create: questions.map(q => ({
        question_text: q,
        status: 'GENERATING',
      })),
    },
  },
  include: {
    task_items: true,
  },
});
```

### 5. Update Task Item After Generation

```typescript
await prisma.taskItem.update({
  where: { id: itemId },
  data: {
    answer_text: generatedAnswer,
    references_used: references,
    status: 'COMPLETED',
  },
});
```

### 6. Get Session with All Items

```typescript
const session = await prisma.taskSession.findUnique({
  where: { id: sessionId },
  include: {
    user: {
      include: {
        student_profile: true,
      },
    },
    course: true,
    task_items: {
      orderBy: { created_at: 'asc' },
    },
  },
});
```

### 7. Daily Usage Analytics

```typescript
// Get usage logs for date range
const logs = await prisma.dailyUsageLog.findMany({
  where: {
    date: {
      gte: startDate,
      lte: endDate,
    },
  },
  include: {
    user: {
      select: {
        username: true,
        subscription_tier: true,
      },
    },
  },
  orderBy: { date: 'desc' },
});

// Aggregate daily totals
const dailyTotals = await prisma.dailyUsageLog.groupBy({
  by: ['date'],
  _sum: {
    deepseek_tokens_used: true,
    tavily_calls: true,
    exa_calls: true,
    estimated_cost: true,
  },
  orderBy: { date: 'desc' },
});
```

### 8. Regenerate Count Check (with Quota Enforcement)

```typescript
const item = await prisma.taskItem.findUnique({
  where: { id: itemId },
  select: { 
    regenerate_count: true,
    session: {
      select: {
        user_id: true,
      },
    },
  },
});

if (item.regenerate_count >= 5) {
  throw new Error('Regenerate limit reached (max 5)');
}

// Check quota (regenerate counts toward daily quota)
const today = new Date().toISOString().split('T')[0];
const user = await prisma.user.findUnique({
  where: { id: item.session.user_id },
  select: {
    subscription_tier: true,
    daily_usage_count: true,
    last_usage_date: true,
  },
});

// Reset if different day
const lastDate = user.last_usage_date?.toISOString().split('T')[0];
if (lastDate !== today) {
  await prisma.user.update({
    where: { id: item.session.user_id },
    data: {
      daily_usage_count: 0,
      last_usage_date: today,
    },
  });
} else if (user.subscription_tier === 'FREE' && user.daily_usage_count >= 5) {
  throw new Error('Daily quota exceeded - regenerate counts toward quota');
}

// Proceed with regenerate - increment both regenerate_count and daily_usage_count
await prisma.$transaction([
  prisma.taskItem.update({
    where: { id: itemId },
    data: { regenerate_count: { increment: 1 } },
  }),
  prisma.user.update({
    where: { id: item.session.user_id },
    data: { daily_usage_count: { increment: 1 } },
  }),
]);
```

### 9. Data Purge (12 months retention with audit trail)

```typescript
const purgeDate = new Date();
purgeDate.setMonth(purgeDate.getMonth() - 12);

const sessionsToPurge = await prisma.taskSession.findMany({
  where: {
    created_at: { lt: purgeDate },
    user: {
      task_sessions: {
        every: {
          created_at: { lt: purgeDate },
        },
      },
    },
  },
  include: {
    task_items: true,
    user: {
      select: {
        id: true,
        username: true,
      },
    },
  },
});

// Delete in transaction with audit log
for (const session of sessionsToPurge) {
  await prisma.$transaction([
    prisma.taskItem.deleteMany({ where: { session_id: session.id } }),
    prisma.taskSession.delete({ where: { id: session.id } }),
    prisma.dataPurgeLog.create({
      data: {
        user_id: session.user_id,
        username_snapshot: session.user.username, // Preserve username for audit
        sessions_purged: 1,
        items_purged: session.task_items.length,
        reason: 'Auto-purge: 12 months retention policy',
      },
    }),
  ]);
}
```

### 10. AI Provider Configuration

```typescript
// Get active AI provider with config
const provider = await prisma.aiProvider.findFirst({
  where: { is_active: true },
  select: {
    id: true,
    provider_type: true,
    provider_name: true,
    base_url: true,
    api_key: true, // Encrypted - decrypt before use
    default_model: true,
    available_models: true,
  },
});

// Create new AI provider (Admin)
const newProvider = await prisma.aiProvider.create({
  data: {
    provider_type: 'DEEPSEEK',
    provider_name: 'DeepSeek',
    base_url: 'https://api.deepseek.com/v1',
    api_key: encryptedApiKey, // Encrypt before storing
    default_model: 'deepseek-chat',
    available_models: {
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat', owned_by: 'deepseek' },
        { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', owned_by: 'deepseek' },
      ],
      fetched_at: new Date().toISOString(),
    },
  },
});

// Update provider's default model
await prisma.aiProvider.update({
  where: { id: providerId },
  data: {
    default_model: 'deepseek-reasoner',
    updated_at: new Date(),
  },
});

// Fetch and store available models from provider
// (External API call + database update)
const response = await fetch(`${provider.base_url}/models`, {
  headers: { Authorization: `Bearer ${decryptedApiKey}` },
});
const models = await response.json();

await prisma.aiProvider.update({
  where: { id: providerId },
  data: {
    available_models: {
      models: models.data,
      fetched_at: new Date().toISOString(),
    },
    last_model_fetch: new Date(),
  },
});
```

### 11. Search Provider Configuration

```typescript
// Get active search providers
const searchProviders = await prisma.searchProvider.findMany({
  where: { is_active: true },
});

// Get specific provider config
const tavilyConfig = await prisma.searchProvider.findUnique({
  where: { provider_type: 'TAVILY' },
});

// Create or update search provider (Admin)
await prisma.searchProvider.upsert({
  where: { provider_type: 'TAVILY' },
  create: {
    provider_type: 'TAVILY',
    api_key: encryptedApiKey,
    is_active: true,
  },
  update: {
    api_key: encryptedApiKey,
    is_active: true,
    updated_at: new Date(),
  },
});
```

### 12. API Key Encryption/Decryption

```typescript
// Encryption utility (lib/encryption.ts)
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

export function encryptApiKey(apiKey: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return iv:authTag:encrypted (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptApiKey(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
  
  const decipher = createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

---

## Data Constraints Summary

### Table-Level Constraints

| Table | Constraint | Rule |
|-------|------------|------|
| User | username | Unique, min 3 chars, max 50 chars |
| User | password | Hashed with bcrypt, min 8 chars input |
| StudentProfile | user_id | Unique (one profile per user) |
| StudentProfile | university_logo_url | Required (not nullable) |
| TaskItem | regenerate_count | Max 5 |
| DailyUsageLog | user_id + date | Composite index for unique daily entry |

### Business Logic Constraints

| Constraint | Implementation |
|------------|----------------|
| Daily quota (FREE) | 5 sessions/day, checked server-side in transaction before session creation |
| Daily quota (PREMIUM) | Unlimited, with cost alerts for Admin (no hard limit) |
| Regenerate limit | Max 5 per TaskItem, each regenerate counts toward daily quota |
| Data retention | Auto-purge after 12 months |
| Password security | bcrypt hash, min 8 chars, 1 uppercase + 1 number |
| Admin login rate limit | Max 5 failed attempts, lock for 15 minutes |
| Course snapshot | Preserve course data in TaskSession for PDF generation if course deleted |
| Font upload | Optional (user can skip, system uses default Arial) |

### JSON Validation Requirements

| Field | Validation |
|-------|------------|
| references_used | Must contain 2 references minimum (module + secondary source) |
| reference type | Must be valid enum: MODULE, JOURNAL, BOOK, GOVERNMENT, WEB |
| reference source | Must be valid enum: user_input, exa_search, tavily_search, scraper |

---

## Additional Query Patterns

### 10. Admin Login Rate Limiting

```typescript
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

// Check if admin account is locked
const admin = await prisma.user.findUnique({
  where: { username: adminUsername, role: 'ADMIN' },
  select: {
    id: true,
    admin_login_attempts: true,
    admin_login_locked_until: true,
  },
});

if (admin?.admin_login_locked_until && admin.admin_login_locked_until > new Date()) {
  const remainingMinutes = Math.ceil(
    (admin.admin_login_locked_until.getTime() - Date.now()) / 60000
  );
  throw new Error(`Account locked. Try again in ${remainingMinutes} minutes.`);
}

// On failed login attempt
await prisma.user.update({
  where: { id: admin.id },
  data: {
    admin_login_attempts: { increment: 1 },
    admin_login_locked_until: admin.admin_login_attempts >= MAX_ATTEMPTS - 1 
      ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60000) 
      : null,
  },
});

// On successful login - reset attempts
await prisma.user.update({
  where: { id: admin.id },
  data: {
    admin_login_attempts: 0,
    admin_login_locked_until: null,
  },
});
```

---

**Document Version:** 3.0 (Multi-Provider Architecture)
**Last Updated:** April 2026
**Prisma Version:** 5.x
**Changes from v2.0:**
- Added AIProviderType enum (DEEPSEEK, OPENAI, GROQ, TOGETHER, CUSTOM)
- Added SearchProviderType enum (TAVILY, EXA)
- Added AIProvider model for multi-provider configuration
- Added SearchProvider model for Tavily/Exa configuration
- Changed DailyUsageLog.deepseek_tokens_used to llm_tokens_used (generic)
- Added provider configuration query patterns
- Added API key encryption/decryption patterns
- Updated ERD with Provider Configuration section
- Added indexes for provider tables