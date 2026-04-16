# API Endpoints Registry - NugAI

## Document Version: 1.0
## Date: April 2026

---

## 1. Overview

This document provides a complete registry of all API endpoints for the NugAI application. Endpoints are organized by category and include request/response specifications, authentication requirements, and rate limiting.

---

## 2. Authentication Endpoints

### 2.1. NextAuth Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | Public | NextAuth.js built-in authentication handler |
| `/api/auth/signin` | GET | Public | Sign-in page redirect |
| `/api/auth/signout` | GET/POST | Session | Sign-out (invalidate session) |
| `/api/auth/session` | GET | Public | Get current session status |

---

## 3. Student API Endpoints

### 3.1. Profile & Onboarding

#### POST `/api/onboarding`

**Description:** Complete user onboarding (create StudentProfile)

**Auth Required:** Session (STUDENT role)

**Request Body:**
```typescript
{
  full_name: string;         // Min 3, max 100 chars
  nim: string;               // Min 5, max 20 chars, alphanumeric
  university_name: string;   // Min 5, max 100 chars
  faculty: string;           // Min 3, max 50 chars
  study_program: string;     // Min 3, max 50 chars
  upbjj_branch?: string;     // Optional
  university_logo_url: string; // Required (Blob URL after upload)
  pdf_font_url?: string;     // Optional (Blob URL after upload)
}
```

**Response (200):**
```typescript
{
  success: true;
  profile: StudentProfile;
}
```

**Response (400):**
```typescript
{
  error: string;  // Validation error message
}
```

---

#### GET `/api/profile`

**Description:** Get current user's profile

**Auth Required:** Session (STUDENT role)

**Response (200):**
```typescript
{
  profile: StudentProfile | null;
}
```

---

#### PATCH `/api/profile`

**Description:** Update user profile

**Auth Required:** Session (STUDENT role)

**Request Body:**
```typescript
{
  full_name?: string;
  nim?: string;
  university_name?: string;
  faculty?: string;
  study_program?: string;
  upbjj_branch?: string;
  university_logo_url?: string;
  pdf_font_url?: string;
  default_min_words?: number;  // Min 100, max 2000
}
```

**Response (200):**
```typescript
{
  success: true;
  profile: StudentProfile;
}
```

---

### 3.2. Course Management

#### GET `/api/courses`

**Description:** Get all courses for current user (private per-user)

**Auth Required:** Session (STUDENT role)

**Response (200):**
```typescript
{
  courses: Course[];
}
```

---

#### POST `/api/courses`

**Description:** Create new course

**Auth Required:** Session (STUDENT role)

**Request Body:**
```typescript
{
  course_name: string;        // Required, min 3 chars
  module_book_title: string;  // Required
  tutor_name: string;         // Required
}
```

**Response (200):**
```typescript
{
  success: true;
  course: Course;
}
```

---

#### PATCH `/api/courses/:id`

**Description:** Update course

**Auth Required:** Session (STUDENT role, owner only)

**Request Body:**
```typescript
{
  course_name?: string;
  module_book_title?: string;
  tutor_name?: string;
}
```

**Response (200):**
```typescript
{
  success: true;
  course: Course;
}
```

---

#### DELETE `/api/courses/:id`

**Description:** Delete course (cascade to TaskSessions with SetNull)

**Auth Required:** Session (STUDENT role, owner only)

**Response (200):**
```typescript
{
  success: true;
}
```

---

### 3.3. Task Generation

#### POST `/api/generate-task`

**Description:** Generate task answers (3-step wizard Step 2)

**Auth Required:** Session (STUDENT role), quota check

**Rate Limit:** Controlled by daily quota

**Request Body:**
```typescript
{
  task_type: 'DISCUSSION' | 'ASSIGNMENT';
  course_id?: string;         // UUID, optional (can input manual)
  course_name?: string;       // If manual input
  module_book_title?: string; // If manual input
  tutor_name?: string;        // If manual input
  min_words_target: number;   // Min 100, max 2000
  questions: string[];        // Array of question texts
}
```

**Response (Streaming):**
- Returns streaming response via Vercel AI SDK
- Real-time text display
- Word count indicator

**On Completion (200):**
```typescript
{
  sessionId: string;
  taskItems: TaskItem[];
  quotaUsed: number;
}
```

**Response (403 - Quota Exceeded):**
```typescript
{
  error: 'Daily quota exceeded. Upgrade to Premium for unlimited access.';
  currentUsage: number;
  limit: number;
}
```

**Processing Flow:**
1. Server-side quota check (transactional)
2. Reset quota if `last_usage_date !== today`
3. Keyword extraction (DeepSeek)
4. Web search (Tavily + Exa parallel)
5. Context assembly
6. LLM streaming (DeepSeek)
7. Database save (atomic transaction)

---

#### GET `/api/tasks`

**Description:** Get user's task sessions

**Auth Required:** Session (STUDENT role)

**Query Params:**
- `limit`: number (default: 10)
- `offset`: number (default: 0)

**Response (200):**
```typescript
{
  sessions: TaskSession[];
  total: number;
}
```

---

#### GET `/api/tasks/:id`

**Description:** Get specific task session with items

**Auth Required:** Session (STUDENT role, owner only)

**Response (200):**
```typescript
{
  session: TaskSession & {
    task_items: TaskItem[];
    course?: Course;
  };
}
```

---

### 3.4. Regenerate

#### POST `/api/regenerate`

**Description:** Regenerate answer for specific TaskItem

**Auth Required:** Session (STUDENT role), quota check

**Request Body:**
```typescript
{
  taskId: string;            // TaskItem UUID
  instructions?: string;     // Optional regenerate instructions (max 500 chars)
}
```

**Response (Streaming):**
- Returns streaming response via Vercel AI SDK

**Response (403):**
```typescript
{
  error: 'Regenerate limit reached (max 5 per question)';  // or
  error: 'Daily quota exceeded';
}
```

**Database Updates:**
- Increment `TaskItem.regenerate_count`
- Increment `User.daily_usage_count` (counts toward quota)

---

### 3.5. PDF Generation

#### GET `/api/pdf/:sessionId`

**Description:** Generate and download PDF for session

**Auth Required:** Session (STUDENT role, owner only)

**Response:**
- Binary PDF file download
- Content-Type: application/pdf
- Filename: `Tugas_[Type]_[Course]_[Date].pdf`

**PDF Generation:**
- Load session data with snapshot fields
- Load user font (if uploaded) or default
- Template A (Discussion) or Template B (Assignment)

---

### 3.6. Password Change

#### POST `/api/user/change-password`

**Description:** Change own password

**Auth Required:** Session (any role)

**Request Body:**
```typescript
{
  currentPassword: string;   // Required for verification
  newPassword: string;       // Min 8 chars, 1 uppercase + 1 number
}
```

**Response (200):**
```typescript
{
  success: true;
}
```

**Response (400):**
```typescript
{
  error: 'Current password incorrect';  // or
  error: 'New password validation failed';
}
```

---

## 4. Admin API Endpoints

### 4.1. User Management

#### GET `/api/admin/users`

**Description:** List all users

**Auth Required:** Session (ADMIN role)

**Query Params:**
- `role`: 'ADMIN' | 'STUDENT' (filter)
- `tier`: 'FREE' | 'PREMIUM' (filter)
- `limit`: number
- `offset`: number

**Response (200):**
```typescript
{
  users: User[];
  total: number;
}
```

---

#### POST `/api/admin/users`

**Description:** Create new user

**Auth Required:** Session (ADMIN role)

**Request Body:**
```typescript
{
  username: string;          // Min 3, max 50 chars, alphanumeric + underscore
  password: string;          // Min 8 chars, 1 uppercase + 1 number
  role: 'ADMIN' | 'STUDENT';
  subscription_tier: 'FREE' | 'PREMIUM';
}
```

**Response (200):**
```typescript
{
  success: true;
  user: User;  // password omitted
}
```

---

#### PATCH `/api/admin/users/:id`

**Description:** Update user (subscription tier only)

**Auth Required:** Session (ADMIN role)

**Request Body:**
```typescript
{
  subscription_tier: 'FREE' | 'PREMIUM';
}
```

**Response (200):**
```typescript
{
  success: true;
  user: User;
}
```

---

#### POST `/api/admin/users/:id/reset-password`

**Description:** Reset user password (generate temporary)

**Auth Required:** Session (ADMIN role)

**Response (200):**
```typescript
{
  success: true;
  temporaryPassword: string;  // 12-char random alphanumeric
}
```

---

#### DELETE `/api/admin/users/:id`

**Description:** Delete user (cascade cleanup)

**Auth Required:** Session (ADMIN role)

**Response (200):**
```typescript
{
  success: true;
}
```

---

### 4.2. Analytics & Usage

#### GET `/api/admin/analytics`

**Description:** Get API usage analytics

**Auth Required:** Session (ADMIN role)

**Query Params:**
- `startDate`: ISO date
- `endDate`: ISO date
- `userId`: UUID (optional filter)

**Response (200):**
```typescript
{
  totalTokens: number;
  totalTavilyCalls: number;
  totalExaCalls: number;
  estimatedCost: number;    // USD
  dailyBreakdown: {
    date: string;
    tokens: number;
    cost: number;
  }[];
  userBreakdown: {
    userId: string;
    username: string;
    sessions: number;
    cost: number;
  }[];
}
```

---

#### GET `/api/admin/system-health`

**Description:** Get system health status

**Auth Required:** Session (ADMIN role)

**Response (200):**
```typescript
{
  database: 'healthy' | 'warning' | 'critical';
  deepseekAPI: 'healthy' | 'warning' | 'critical';
  tavilyAPI: 'healthy' | 'warning' | 'critical';
  exaAPI: 'healthy' | 'warning' | 'critical';
  errorRate: number;        // Percentage
  avgResponseTime: number;  // ms
}
```

---

## 5. Cron Job Endpoints (Vercel Cron)

### 5.1. Data Purge

#### POST `/api/cron/purge-data`

**Description:** Monthly data purge (12 months retention)

**Auth:** Vercel Cron signature verification

**Schedule:** `0 0 1 * *` (Monthly on 1st at midnight)

**Processing:**
```typescript
1. Find sessions older than 12 months
2. Check if user has no newer sessions (inactive)
3. Store user_id and username in DataPurgeLog
4. Delete TaskItems (cascade)
5. Delete TaskSessions
6. Log purge activity
```

**Response (200):**
```typescript
{
  success: true;
  sessionsPurged: number;
  itemsPurged: number;
}
```

---

### 5.2. Blob Cleanup

#### POST `/api/cron/cleanup-temp-blobs`

**Description:** Daily cleanup of temporary OCR images

**Auth:** Vercel Cron signature verification

**Schedule:** `0 3 * * *` (Daily at 3am)

**Processing:**
```typescript
1. List blobs with "temp-ocr" prefix
2. Check created_at > 24 hours
3. Delete old blobs
```

**Response (200):**
```typescript
{
  success: true;
  blobsDeleted: number;
}
```

---

### 5.3. Quota Reset (Optional)

#### POST `/api/cron/reset-quotas`

**Description:** Daily quota reset (alternative to middleware check)

**Auth:** Vercel Cron signature verification

**Schedule:** `0 0 * * *` (Daily at midnight)

**Processing:**
```typescript
1. Find users where last_usage_date < today
2. Reset daily_usage_count = 0
3. Update last_usage_date = null (or keep as reference)
```

**Note:** This is optional. Middleware check on first request is preferred.

---

## 6. File Upload Endpoints

### 6.1. Logo Upload

#### POST `/api/upload/logo`

**Description:** Upload university logo

**Auth Required:** Session (STUDENT role)

**Request:** multipart/form-data
- `file`: Image file (JPG/PNG/WebP)
- Max 2MB

**Response (200):**
```typescript
{
  success: true;
  url: string;  // Vercel Blob URL
}
```

---

### 6.2. Font Upload

#### POST `/api/upload/font`

**Description:** Upload PDF font (optional)

**Auth Required:** Session (STUDENT role)

**Request:** multipart/form-data
- `file`: Font file (.ttf)
- Max 2MB per file
- Can upload 3 files: Regular, Bold, Italic

**Response (200):**
```typescript
{
  success: true;
  urls: {
    regular: string;
    bold?: string;
    italic?: string;
  };
}
```

---

### 6.3. OCR Image Upload

#### POST `/api/upload/ocr-image`

**Description:** Upload temporary OCR image

**Auth Required:** Session (STUDENT role)

**Request:** multipart/form-data
- `files`: Image files (JPG/PNG/WebP)
- Max 5 images, each max 2MB

**Response (200):**
```typescript
{
  success: true;
  urls: string[];  // Temporary Blob URLs
}
```

**Note:** URLs are temporary, auto-deleted after 24 hours by cron.

---

## 7. Rate Limiting Summary

| Endpoint Category | Rate Limit | Enforcement |
|-------------------|------------|-------------|
| `/api/auth/*` | 10 req/min per IP | Server-side |
| `/api/generate-task` | Quota-based | Server-side (FREE: 5/day) |
| `/api/regenerate` | Quota-based + 5/item | Server-side |
| `/api/admin/*` | 60 req/min per session | Server-side |
| `/api/upload/*` | 5 req/min per user | Server-side |
| Admin Login | 5 failed attempts | Account lock 15 min |

---

## 8. Error Response Format

All API errors follow this format:

```typescript
{
  error: string;           // Human-readable error message
  code?: string;           // Error code (e.g., ERR-STEP1-001)
  details?: object;        // Additional error details
}
```

**HTTP Status Codes:**
- 200: Success
- 400: Bad Request (validation error)
- 401: Unauthorized (no session)
- 403: Forbidden (quota exceeded, rate limit, wrong role)
- 404: Not Found
- 500: Internal Server Error

---

## 9. Authentication Middleware

All protected routes go through NextAuth middleware:

```typescript
// middleware.ts
export { auth as middleware } from '@/auth';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/task/:path*',
    '/courses/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/api/(auth|generate-task|regenerate|courses|profile|tasks|upload|user|admin|cron)/:path*',
  ],
};
```

**Middleware Logic:**
1. Check session exists
2. Check role matches route (ADMIN for /admin/*, STUDENT for others)
3. Check StudentProfile exists (redirect to /onboarding if not)
4. Check admin rate limit (if ADMIN login)

---

**Document Version:** 1.0
**Last Updated:** April 2026