# Technical Product Requirements Document (PRD) - NugAI
## Final Version (Revised)

---

## 1. Project Metadata
* **App Name:** NugAI (Nugas sama AI)
* **Developer:** EAS Creative Studio
* **Website:** eas.biz.id
* **Contact:** support@eas.biz.id / eas.creative.studio@gmail.com
* **Year of Development:** 2026
* **Target Environment:** Vercel (Serverless), Next.js App Router

---

## 2. Project Overview & Objectives

NugAI adalah aplikasi web berbasis AI (LLM) yang dirancang untuk mengotomatisasi penyusunan jawaban tugas akademik (Tugas Diskusi & Tugas Soal) mahasiswa. Sistem harus menghasilkan output dengan tingkat kredibilitas tinggi melalui integrasi *real-time web search* (Mencari referensi jurnal/modul), menerapkan gaya bahasa *"Humanized"* (Baku Semi-Formal), dan secara otomatis memformat output menjadi dokumen PDF siap kumpul sesuai standar akademik (Margin, Font, Cover terstruktur).

### 2.1. Key Objectives
1. Menghasilkan jawaban tugas akademik dengan referensi kredibel (jurnal, modul, buku)
2. Menerapkan gaya bahasa Indonesia Baku Semi-Formal yang "humanized" (non-robotic)
3. Format output PDF sesuai standar akademik universitas
4. Memberikan pengalaman user-friendly dengan wizard flow 3-step
5. Mengoptimalkan cost API dengan quota management dan server-side enforcement
6. Melindungi sistem dari abuse dengan rate limiting dan security measures

---

## 3. Tech Stack & Dependencies

### 3.1. Core Technologies
| Category | Technology | Notes |
|----------|------------|-------|
| Framework | Next.js (App Router) | Serverless-ready for Vercel |
| Language | TypeScript | Strict mode enabled |
| UI Library | React 18+ | Client components for interactivity |
| Styling | Tailwind CSS | Utility-first styling |
| Component Library | shadcn/ui | Form, Dialog, Dropdown, Tabs, Combobox |
| Notification | sonner | Toast notification system |
| UI Font | Space Grotesk | Google Fonts, open-source, modern geometric |
| PDF Font | Arial | User-upload custom font for PDF generation |

### 3.2. Backend & Database
| Category | Technology | Notes |
|----------|------------|-------|
| Database | Vercel Postgres | Relational database, serverless |
| ORM | Prisma | Schema-first, TypeScript native |
| Authentication | NextAuth.js v5 (Auth.js) | CredentialsProvider |
| Caching | None (for MVP) | Future: Redis for rate limiting |

### 3.3. AI & Search Services
| Category | Technology | Notes |
|----------|------------|-------|
| AI SDK | Vercel AI SDK | Streaming response support, OpenAI-compatible |
| LLM Provider | Multi-Provider (OpenAI-Compatible) | DeepSeek, OpenAI, Groq, Together AI, or Custom |
| Provider Config | Admin-managed | API key, Base URL, Model selection configured by Admin |
| Search API | Tavily API | General facts & web search (Admin-managed) |
| Search API | Exa API | Academic journals & books search (Admin-managed) |
| OCR Engine | Tesseract.js | Client-side image-to-text |
| PDF Generation | @react-pdf/renderer | Server/client-side rendering with custom font embedding |

#### 3.3.1. Supported AI Providers (Preset)
| Provider | Base URL | Notes |
|----------|----------|-------|
| DeepSeek | https://api.deepseek.com/v1 | Cost-effective, good for academic tasks |
| OpenAI | https://api.openai.com/v1 | Premium quality, higher cost |
| Groq | https://api.groq.com/openai/v1 | Fast inference, LPU-based |
| Together AI | https://api.together.xyz/v1 | Open-source models hosting |
| Custom | User-defined | Any OpenAI-compatible API endpoint |

#### 3.3.2. Model Selection Flow
1. Admin configures provider (Base URL + API Key)
2. System fetches available models from provider endpoint (`/models`)
3. Admin selects default model for task generation
4. Users use the configured model without seeing API credentials

### 3.4. Monitoring & Tracking
| Category | Technology | Notes |
|----------|------------|-------|
| Error Tracking | Sentry | Real-time error monitoring & performance |
| Analytics | Vercel Analytics | Built-in deployment analytics |

---

## 4. Database Schema (Entity Relationship)

*AI Agent Note: Gunakan relasi di bawah ini untuk membentuk Prisma Schema. Referensi detail schema: `DATABASE_SCHEMA.md`*

### 4.1. `User` Table
Menyimpan kredensial login dan subscription status.
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `username` | String | Unique, Required | Login username |
| `password` | String | Required, Hashed (bcrypt) | Login password |
| `role` | Enum | `ADMIN`, `STUDENT` | User role |
| `subscription_tier` | Enum | `FREE`, `PREMIUM` | Subscription level |
| `daily_usage_count` | Int | Default: 0 | Sessions used today |
| `last_usage_date` | Date | Nullable | Last session date (for quota reset) |
| `created_at` | Timestamp | Auto-generated | Account creation time |

### 4.2. `StudentProfile` Table
Menyimpan data statis untuk Contextual Memory dan Cover PDF. (One-to-One dengan User).
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK -> User.id, Unique | User reference |
| `full_name` | String | Required | Student full name |
| `nim` | String | Required | Student ID number |
| `university_name` | String | Required | University name |
| `faculty` | String | Required | Faculty name |
| `study_program` | String | Required | Study program/major |
| `upbjj_branch` | String | Nullable | UPBJJ/branch location |
| `university_logo_url` | String | Required | URL to uploaded logo (Vercel Blob) |
| `default_min_words` | Int | Default: 300 | Default minimum word count |
| `default_tone` | String | Default: "Bahasa Indonesia Baku Semi-Formal" | Default writing tone |
| `pdf_font_url` | String | **Nullable (Optional)** | URL to user-uploaded Arial font file. If null, system uses default Arial font from `/public/fonts/` |

**Note:** Font upload is OPTIONAL. User can skip font upload during onboarding. System provides default Arial font files (Regular, Bold, Italic) in `/public/fonts/` directory.

### 4.3. `Course` Table
Menyimpan library mata kuliah milik masing-masing user. Private per-user, tidak ada shared master data. (One-to-Many dari User).
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK -> User.id | Owner reference |
| `course_name` | String | Required | Course name |
| `module_book_title` | String | Required | Module/book title |
| `tutor_name` | String | Required | Tutor/instructor name |
| `created_at` | Timestamp | Auto-generated | Creation time |

### 4.4. `TaskSession` Table
Menyimpan metadata dari satu sesi pengerjaan tugas (wizard).
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK -> User.id | Owner reference |
| `course_id` | UUID | FK -> Course.id, Nullable | Course reference (if selected) |
| `task_type` | Enum | `DISCUSSION`, `ASSIGNMENT` | Task type |
| `min_words_target` | Int | Required | Minimum word count target |
| `regenerate_count` | Int | Default: 0 | Total regenerate attempts (counts toward quota) |
| `course_name_snapshot` | String | Nullable | Snapshot of course name (preserved if course deleted) |
| `module_book_title_snapshot` | String | Nullable | Snapshot of module title (preserved for PDF) |
| `tutor_name_snapshot` | String | Nullable | Snapshot of tutor name (preserved for PDF) |
| `created_at` | Timestamp | Auto-generated | Session creation time |

**Snapshot Fields Purpose:** Preserve course data for PDF generation even if original Course is deleted. Copied from Course table at session creation time.

### 4.5. `TaskItem` Table
Menyimpan detail per-nomor soal beserta jawaban dan referensinya. (One-to-Many dari TaskSession).
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `session_id` | UUID | FK -> TaskSession.id | Session reference |
| `question_text` | Text | Required | The question/problem text |
| `answer_text` | Text | Nullable | Generated AI answer |
| `references_used` | JSON | Nullable (validated) | References metadata (see Section 4.6) |
| `regenerate_count` | Int | Default: 0 | Regenerate attempts for this item (max 5, counts toward quota) |
| `status` | Enum | `GENERATING`, `COMPLETED`, `FAILED`, `DRAFT` | Generation status |
| `created_at` | Timestamp | Auto-generated | Creation time |

**Status Values:**
- `GENERATING`: Answer is being generated (streaming in progress)
- `COMPLETED`: Answer successfully generated and saved
- `FAILED`: Generation failed after retries
- `DRAFT`: User saved as draft for later review

### 4.6. `references_used` JSON Structure (Polymorphic)

```json
// Reference Type: MODULE (Primary reference from user input)
{
  "type": "module",
  "title": "Judul Modul/Buku",
  "author": "Nama Penulis",
  "year": "2024",
  "publisher": "Nama Penerbit",
  "source": "user_input"
}

// Reference Type: JOURNAL (From Exa/Tavily search)
{
  "type": "journal",
  "title": "Judul Artikel",
  "authors": ["Author 1", "Author 2"],
  "journal_name": "Nama Jurnal",
  "year": "2023",
  "volume": "5",
  "issue": "2",
  "pages": "123-145",
  "url": "https://...",
  "doi": "10.xxx/xxx",
  "source": "exa_search"
}

// Reference Type: BOOK (From search results)
{
  "type": "book",
  "title": "Judul Buku",
  "authors": ["Author 1"],
  "year": "2022",
  "publisher": "Penerbit",
  "isbn": "978-xxx",
  "url": "https://...",
  "source": "tavily_search"
}

// Reference Type: GOVERNMENT_REGULATION (From search results)
{
  "type": "government",
  "title": "Undang-Undang/Peraturan",
  "number": "UU No. XX Tahun XXXX",
  "year": "2024",
  "institution": "Kementerian/Lembaga",
  "url": "https://...",
  "source": "tavily_search"
}
```

### 4.7. `DailyUsageLog` Table
Menyimpan log usage untuk tracking API cost di Admin dashboard. Created AFTER session completion.
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK -> User.id | User reference |
| `session_id` | UUID | FK -> TaskSession.id | Session reference |
| `deepseek_tokens_used` | Int | Nullable | Tokens consumed by DeepSeek |
| `tavily_calls` | Int | Default: 0 | Tavily API calls count |
| `exa_calls` | Int | Default: 0 | Exa API calls count |
| `estimated_cost` | Decimal | Nullable | Estimated API cost (USD) |
| `date` | Date | Required | Usage date |
| `created_at` | Timestamp | Auto-generated | Log creation time |

**Creation Sequence:**
1. Quota check uses `User.daily_usage_count` (NOT DailyUsageLog)
2. TaskSession is created
3. Generation completes
4. DailyUsageLog is created with session reference
5. User.daily_usage_count is incremented

This ensures DailyUsageLog exists only for completed/failed sessions, not for quota checks.

### 4.8. `AIProvider` Table
Menyimpan konfigurasi provider AI yang dikelola oleh Admin. (Admin-only management).
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `provider_type` | Enum | `DEEPSEEK`, `OPENAI`, `GROQ`, `TOGETHER`, `CUSTOM` | Provider type (preset or custom) |
| `provider_name` | String | Required | Display name (e.g., "DeepSeek", "OpenAI") |
| `base_url` | String | Required | OpenAI-compatible API base URL |
| `api_key` | String | Required, Encrypted | API key (encrypted in database) |
| `available_models` | JSON | Nullable | List of fetched models from provider |
| `default_model` | String | Required | Selected default model ID for task generation |
| `is_active` | Boolean | Default: true | Provider is active/inactive |
| `last_model_fetch` | Timestamp | Nullable | Last time models were fetched from provider |
| `created_at` | Timestamp | Auto-generated | Creation time |
| `updated_at` | Timestamp | Auto-updated | Last update time |

**Provider Types:**
- `DEEPSEEK`: Pre-configured with DeepSeek base URL
- `OPENAI`: Pre-configured with OpenAI base URL
- `GROQ`: Pre-configured with Groq base URL
- `TOGETHER`: Pre-configured with Together AI base URL
- `CUSTOM`: Admin-defined base URL for any OpenAI-compatible provider

**Model Fetch Flow:**
1. Admin saves provider config (base_url + api_key)
2. System calls `{base_url}/models` endpoint (OpenAI-compatible)
3. Response parsed and stored in `available_models` JSON
4. Admin selects `default_model` from available models
5. `last_model_fetch` updated to track freshness

**available_models JSON Structure:**
```json
{
  "models": [
    {
      "id": "deepseek-chat",
      "name": "DeepSeek Chat",
      "owned_by": "deepseek"
    },
    {
      "id": "deepseek-reasoner",
      "name": "DeepSeek Reasoner",
      "owned_by": "deepseek"
    }
  ],
  "fetched_at": "2026-04-16T10:30:00Z"
}
```

### 4.9. `SearchProvider` Table
Menyimpan konfigurasi Search API (Tavily/Exa) yang dikelola oleh Admin.
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `provider_type` | Enum | `TAVILY`, `EXA` | Search provider type |
| `api_key` | String | Required, Encrypted | API key (encrypted) |
| `is_active` | Boolean | Default: true | Provider is active |
| `created_at` | Timestamp | Auto-generated | Creation time |
| `updated_at` | Timestamp | Auto-updated | Last update time |

**Note:** Both Tavily and Exa are configured by Admin. Only one active config per provider type allowed.

---

## 5. User Flow & Core Features

*AI Agent Note: Referensi detail flow diagram: `USER_FLOW.md`*

### 5.1. Authentication & Onboarding Flow

#### Admin Access
1. **Admin Login Entry:** Icon kecil di halaman login (tidak hidden route)
2. **Admin Credentials:** Admin login menggunakan username/password terpisah
3. **Admin Dashboard:** Manage users, view API costs, system monitoring

#### Student Flow
1. **Student Login:** User login dengan credentials yang dibuat Admin
2. **Middleware Check:** NextAuth middleware check relasi `User` ke `StudentProfile`
3. **Onboarding Intercept:** 
   - Jika `StudentProfile` kosong → redirect ke `/onboarding`
   - User wajib mengisi: Nama, NIM, Univ, Fakultas, Prodi, UPBJJ, Upload Logo
   - **Upload Font (OPTIONAL):** User dapat skip upload font Arial - system provides default
   - Tidak bisa akses dashboard sebelum data wajib lengkap (font optional)
4. **Dashboard Access:** Setelah onboarding complete → redirect ke `/dashboard`

### 5.2. Task Generation Flow (The 3-Step Wizard)

#### STEP 1: Input & Context Setup (Client-Side State)

**UI Components:**
- `Tabs` atau `RadioGroup` untuk Jenis Tugas (`DISCUSSION` / `ASSIGNMENT`)
- `Combobox` untuk Mata Kuliah (dari tabel `Course`)
- `NumberInput` untuk target minimum kata
- `Textarea` untuk input soal
- `Dropzone` untuk upload gambar (OCR)
- Button "Tambah Mata Kuliah Manual" untuk input temporer

**Logic Mata Kuliah:**
- Fetch data dari tabel `Course` milik user
- Jika dipilih → auto-fill "Judul Modul" dan "Nama Tutor"
- Option untuk input manual (tidak disimpan ke database)

**Logic Panjang Jawaban:**
- Auto-fill dari `StudentProfile.default_min_words`
- User bisa modify via number input
- Buffer range: 5% - 20% dari target minimum

**Input Soal (OCR Integration):**
- Textarea untuk text input manual
- Dropzone untuk multiple images per soal
- Supported formats: JPG, PNG, WebP
- Max file size: 2MB per image
- OCR process: Tesseract.js (client-side)
- Results: Append ke textarea, user bisa edit hasil OCR
- Failure handling: Alert user, retry or manual input

**Quota Check (Server-Side Enforcement):**
- Check performed in API route using database transaction
- Query `User.daily_usage_count` vs limit (FREE: 5/day, PREMIUM: unlimited)
- Reset `daily_usage_count` to 0 if `last_usage_date !== today` (first request of day)
- If FREE tier exceeded → Return 403 error with quota message, client shows alert
- If valid → Proceed to Step 2
- **IMPORTANT:** Quota increment happens AFTER successful generation (atomic transaction)

#### STEP 2: Processing & Research Pipeline (Server-Side Logic)

**API Endpoint:** `/api/generate-task`

**Phase 1 - Keyword Extraction:**
- Extract keywords dari soal + judul modul
- Optimize query for search APIs

**Phase 2 - Web Search:**
- Call Tavily API (general facts, web content)
- Call Exa API (academic journals, books, regulations)
- **Retry Logic:**
  - Each API max retry 2 times with 1 second delay
  - If Tavily fails → Use Exa results only (with warning)
  - If Exa fails → Use Tavily results only (with warning)
  - If BOTH APIs fail → Block with error message, cannot proceed (no fallback scraper)
- All failure → Block & alert user: "Pencarian referensi gagal. Silakan retry atau coba lagi nanti."

**Phase 3 - Context Assembly:**
- Combine search results + module info + user profile
- Build System Prompt dengan injected context

**Phase 4 - LLM Streaming:**
- Call configured AI provider via Vercel AI SDK (`streamText`)
- Use OpenAI-compatible interface with dynamic base_url and api_key
- Model: `AIProvider.default_model` (selected by Admin)
- Stream response to client (real-time display)
- On `onFinish` callback → **Transaction:**
  - Create `TaskSession` record with snapshot fields (course_name, module_title, tutor_name)
  - Create `TaskItem` records (one per soal)
  - Increment `User.daily_usage_count` atomically
  - Update `User.last_usage_date` to today
  - Create `DailyUsageLog` entry
  - Set status `COMPLETED` or `FAILED`

#### STEP 3: Result & Persistent Storage

**Display:**
- Render streaming text as Markdown/HTML
- Show word count indicator
- Display references used (with sources)

**Database Save:**
- Create `TaskSession` record
- Create `TaskItem` records (one per soal)
- Update `User.daily_usage_count`
- Create `DailyUsageLog` entry
- Set status `COMPLETED` or `FAILED`

**Actions Available:**
- Button "Regenerate" (max 5 per soal)
- Button "Download PDF"
- Button "Save as Draft" (optional)

### 5.3. Regenerate Engine (Counts Toward Daily Quota)

**Trigger:** User klik "Regenerate" + optional "Instruksi Perbaikan" text input

**Quota Enforcement:**
- **Each regenerate counts toward daily quota** (FREE tier: 5/day total)
- Before regenerate, check `User.daily_usage_count` against limit
- If FREE tier quota exceeded → Alert "Daily quota exceeded, cannot regenerate"
- If within quota → Proceed

**Payload Construction:**
```
[Original Question] + [Previous Research Results] + [Last Answer] + [Regenerate Instructions]
```

**Prompt Override:**
- AI instructed untuk revise last answer based on feedback
- NOT creating new answer from scratch
- Preserve context dan fix specific issues

**Limit Enforcement:**
- Track `regenerate_count` per `TaskItem` (max 5)
- Increment `User.daily_usage_count` after successful regenerate
- If regenerate_count >= 5 → Alert "Regenerate limit reached for this question"
- If daily quota exceeded → Alert "Daily quota exceeded"

### 5.4. PDF Generation & Download

**Trigger:** User klik "Download PDF" button

**Process:**
- Generate PDF on-demand (not stored in database)
- Use `@react-pdf/renderer` with font:
  - If `StudentProfile.pdf_font_url` exists → Use user-uploaded font
  - If null → Use default Arial font from `/public/fonts/`
- Format based on `task_type` (Template A or Template B)
- Use snapshot fields from `TaskSession` for course info (preserves data if course deleted)

**Font Loading Strategy:**
```typescript
// Determine font source
const fontUrl = studentProfile.pdf_font_url || '/fonts/Arial-';

Font.register({
  family: 'Arial',
  fonts: [
    { src: fontUrl + 'Regular.ttf' },
    { src: fontUrl + 'Bold.ttf', fontWeight: 'bold' },
    { src: fontUrl + 'Italic.ttf', fontStyle: 'italic' },
  ],
});
```

**PDF Templates:**

**Template A: Tugas Diskusi**
1. Opening: Salam pembuka ("Assalamualaikum...", "Selamat pagi/siang/sore...")
2. Body: Isi jawaban (formatted paragraphs)
3. Closing: Simpulan singkat + Salam penutup
4. References: Daftar referensi (modul + jurnal/buku)

**Template B: Tugas Soal (Makalah)**
1. Page 1 (Cover): Center-aligned
   - Title: "TUGAS TUTORIAL" + "MATA KULIAH [Nama]"
   - University Logo (Image component)
   - Tutor: "TUTOR PEMBIMBING: [Nama]"
   - Student: "DISUSUN OLEH: [Nama] | [NIM]"
   - Footer: Prodi, Fakultas, UPBJJ, Universitas
2. Page 2: Daftar semua soal
3. Page 3+: Jawaban per soal (force new page per soal)
   - Nomor Soal → Jawaban → References

---

## 6. AI Prompt Engineering & Logic Constraints

*AI Agent Note: Variabel di bawah harus diinjeksi dinamis ke parameter `system` pada pemanggilan model.*

### 6.1. Contextual Persona
```
Kamu adalah mahasiswa tingkat sarjana program studi {study_program} di {university_name}. 
Jawab pertanyaan akademik ini sesuai bidang studimu dengan pemahaman yang mendalam dan 
argumentasi yang logis.
```

### 6.2. Language & Tone Constraint
```
WAJIB menggunakan Bahasa Indonesia Baku Semi-Formal.

LARANGAN:
- Hindari kata-kata robotik atau transisi klise AI seperti: "Selain itu", "Kesimpulannya", 
  "Dalam era modern ini", "Perlu dicatat bahwa"
- Hindari bahasa gaul/slang: "gon", "sih", "nih", "banget"
- Hindari penggunaan berlebihan bullet points atau numbered lists

GAYA YANG DIHARAPKAN:
- Gunakan paragraf naratif yang mengalir natural
- Variasi struktur kalimat (tidak monoton)
- Argumentasi dengan contoh konkret dan analogi
- Tone: Professional tapi accessible, seperti esai mahasiswa berprestasi
```

### 6.3. Word Count Constraint
```
Jawaban HARUS MEMILIKI MINIMAL {min_words_target} KATA.

Diizinkan melebihi target dengan buffer 5% hingga 20% untuk:
- Menjaga kelengkapan argumentasi
- Menghindari kalimat terpotong artificial
- Memastikan logika flow natural

Word count dihitung setelah formatting final (tidak termasuk references).
```

### 6.4. Reference Mandate
```
WAJIB mencantumkan 2 referensi pada akhir jawaban setiap nomor soal:

1. PRIMARY REFERENCE (Modul Utama):
   - Source: {module_book_title}
   - Author: {tutor_name} atau dari data user
   - Format: [Penulis]. [Tahun]. [Judul Modul] (Italic). [Penerbit].

2. SECONDARY REFERENCE (Web Search Result):
   - Must be kredibel source: Jurnal akademik, Buku referensi, atau 
     Aturan Pemerintah (UU/Peraturan)
   - NOT acceptable: Blog random, Wikipedia, forum, social media
   - Format sesuai type (Jurnal/Buku/Government regulation)

Prioritas referensi dari hasil search:
- Exa API results (academic journals) → highest priority
- Tavily results (books, regulations) → medium priority
- General web content → lowest priority, only if no academic sources found
```

### 6.5. Structural Format Constraint (per Task Type)

**For Tugas Diskusi:**
```
STRUKTUR JAWABAN:
1. Salam pembuka (1-2 kalimat, natural, tidak template-y)
2. Body jawaban (paragraf naratif, argumentasi bertahap)
3. Penutup (1-2 kalimat simpulan, natural)
4. Daftar referensi (2 items, formatted properly)

TIDAK BOLEH:
- Memulai dengan template greeting yang sama setiap soal
- Mengakhiri dengan template closing yang sama setiap soal
- Menggunakan heading/subheading berlebihan
```

**For Tugas Soal/Makalah:**
```
STRUKTUR JAWABAN:
1. Nomor soal (heading)
2. Body jawaban (paragraf naratif, argumen mendalam)
3. Daftar referensi (2 items, formatted properly)

FORMAT:
- Setiap jawaban soal dimulai di halaman baru (force page break)
- References langsung di bawah jawaban (bukan di halaman terpisah)
```

---

## 7. Document Generation Requirements (PDF Strict Formatting)

### 7.1. Global Document Styles

| Property | Value | Notes |
|----------|-------|-------|
| Page Size | A4 | Standard academic paper size |
| Margin (all sides) | 2.5 cm | 1 inch equivalent |
| Font Family | Arial | User-uploaded .ttf file |
| Font Files Required | Regular, Bold, Italic | .ttf format |
| Line Height | 1.15 | Single spacing with slight buffer |
| Font Size (Body) | 12pt | Standard academic body text |
| Font Size (Headers) | 14pt | For titles and section headers |
| Text Alignment | Left-align body, Center-align cover | Per template requirements |
| Page Numbering | Bottom-center, starting page 3 | Exclude cover and soal list |

### 7.2. Font Loading (@react-pdf/renderer)

```typescript
// Font registration example
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Arial',
  fonts: [
    { src: '/fonts/Arial-Regular.ttf' },
    { src: '/fonts/Arial-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Arial-Italic.ttf', fontStyle: 'italic' },
  ],
});
```

### 7.3. Template A: Tugas Diskusi

**Page Structure:**
- Single continuous document
- No cover page
- Header: "Tugas Diskusi - [Mata Kuliah]" (optional)

**Content Flow:**
1. **Salam Pembuka** (1 paragraph)
   - Contoh: "Assalamualaikum warahmatullahi wabarakatuh. Selamat pagi Bapak/Ibu Tutor dan teman-teman."
   - Variasi greeting sesuai waktu (pagi/siang/sore/malam)
   
2. **Body Jawaban** (multiple paragraphs)
   - Narrative style, argumen bertahap
   - No excessive bullet points
   
3. **Simpulan & Penutup** (1 paragraph)
   - Contoh: "Demikian jawaban untuk pertanyaan ini. Semoga dapat memberikan pemahaman yang lebih baik terkait topik yang dibahas. Wassalamualaikum warahmatullahi wabarakatuh."
   
4. **Daftar Referensi**
   ```
   Referensi:
   1. [Penulis]. [Tahun]. [Judul Modul] (Italic). [Penerbit].
   2. [Penulis]. ([Tahun]). [Judul Artikel]. [Nama Jurnal] (Italic), [Vol](No), [Hal].
   ```

### 7.4. Template B: Tugas Soal (Makalah)

**Page 1: Cover (Center-Aligned)**

| Component | Format |
|-----------|--------|
| Title | "TUGAS TUTORIAL" (Bold, 14pt) |
| Subtitle | "MATA KULIAH: [Nama Mata Kuliah]" (Bold, 14pt) |
| University Logo | Image component, proportional sizing (max width: 150px) |
| Tutor Section | "TUTOR PEMBIMBING:" (Bold) + "[Nama Tutor]" |
| Student Section | "DISUSUN OLEH:" (Bold) + "[Nama]" + "[NIM]" |
| Footer | "[Program Studi]" + "[Fakultas]" + "[UPBJJ]" + "[Universitas]" (Bold, 14pt) |

**Page 2: Daftar Soal**
- Header: "DAFTAR SOAL" (Bold, 14pt, center)
- Body: List semua soal dengan nomor
- Format: Numbered list, left-aligned

**Page 3+: Jawaban (Per Soal)**
- **Force page break** sebelum setiap jawaban baru
- Header: "SOAL NOMOR [X]" (Bold, 14pt)
- Body: Jawaban narrative (12pt, 1.15 line height)
- Footer per-soal: Daftar referensi (2 items)
- Page numbering: Bottom-center

### 7.5. PDF Metadata

```typescript
// Document metadata
const documentMeta = {
  title: `Tugas ${taskType} - ${courseName}`,
  author: `${studentName} - ${nim}`,
  subject: `Mata Kuliah: ${courseName}`,
  creator: 'NugAI by EAS Creative Studio',
  producer: '@react-pdf/renderer',
};

// Footer attribution (optional)
<footer>
  Generated by NugAI - EAS Creative Studio (eas.biz.id)
</footer>
```

---

## 8. API Cost Management & Admin Dashboard

### 8.1. Admin Dashboard Features

**User Management Panel:**
- List all users with status (FREE/PREMIUM)
- Create new user (manual single entry)
- Edit user subscription tier
- View user activity history
- Reset user password (manual - generate temporary password)
- Delete user (with cascade cleanup)

**AI Provider Management Panel:**
- Configure AI providers (DeepSeek, OpenAI, Groq, Together AI, Custom)
- Input Base URL and API Key for each provider
- Fetch available models from provider endpoint
- Select default model for task generation
- Toggle provider active/inactive status
- View provider health status (API connectivity check)
- Cost estimation per provider based on model pricing

**Search API Configuration:**
- Configure Tavily API key
- Configure Exa API key
- Toggle search providers active/inactive
- View search API usage metrics

**Admin Login Protection (Rate Limiting):**
- Admin login icon visible on login page (not hidden)
- Rate limiting: Max 5 failed attempts per admin account
- Lock duration: 15 minutes after max attempts
- Fields tracked: `User.admin_login_attempts`, `User.admin_login_locked_until`
- Reset attempts on successful login

**API Usage Dashboard:**
- Daily/Weekly/Monthly usage metrics
- LLM token consumption chart (per provider)
- Tavily API calls count
- Exa API calls count
- Estimated cost calculation (USD/IDR)
- Usage per user breakdown

**System Health:**
- Error rate monitoring
- API response time metrics
- Database connection status

### 8.2. Daily Usage Tracking

**Tracking Logic (Server-Side Transactional):**
```typescript
// On API route /api/generate-task
// Step 1: Check quota (atomic read + reset if needed)
const today = new Date().toISOString().split('T')[0];

const canProceed = await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      subscription_tier: true,
      daily_usage_count: true,
      last_usage_date: true,
    },
  });

  // Reset if different day (first request of the day)
  if (user.last_usage_date?.toISOString().split('T')[0] !== today) {
    await tx.user.update({
      where: { id: userId },
      data: {
        daily_usage_count: 0,
        last_usage_date: today,
      },
    });
    return true;
  }

  // Check limit
  if (user.subscription_tier === 'PREMIUM') {
    return true; // Unlimited, but cost alerts apply
  }
  
  return user.daily_usage_count < 5; // FREE tier limit
});

if (!canProceed) {
  return NextResponse.json(
    { error: 'Daily quota exceeded. Upgrade to Premium for unlimited access.' },
    { status: 403 }
  );
}

// Step 2: Proceed with generation...

// Step 3: On successful completion, increment quota in transaction
await prisma.$transaction([
  prisma.user.update({
    where: { id: userId },
    data: {
      daily_usage_count: { increment: 1 },
      last_usage_date: today,
    },
  }),
  prisma.taskSession.create({ ... }),
  prisma.dailyUsageLog.create({ ... }),
]);
```

**Premium Tier Cost Alerts:**
- No hard limit for PREMIUM users
- Admin dashboard shows cost projections
- Alert threshold: If user exceeds 50 sessions/month, flag for review
- Daily cost summary sent to admin dashboard (not email)

### 8.3. Quota Enforcement (Server-Side)

| Tier | Daily Limit | Notes |
|------|-------------|-------|
| FREE | 5 sessions/day | Hard limit enforced server-side (transaction) |
| PREMIUM | Unlimited | No daily limit, cost alerts for Admin review |

**Enforcement Flow (Server-Side API Route):**
1. User submits task → Client calls `/api/generate-task`
2. API route performs transactional quota check:
   - Check `User.daily_usage_count` and `last_usage_date`
   - Reset if different day (first request)
   - Compare against limit (FREE: 5, PREMIUM: skip)
3. If FREE exceeded → Return HTTP 403, client displays alert
4. If valid → Proceed with generation pipeline
5. After successful generation → Atomic increment of quota count

**Client-Side UX:**
- Dashboard shows current usage: "X/5 tasks today (FREE)" or "Unlimited (PREMIUM)"
- Before Step 2, client shows warning if approaching limit
- Error toast on 403 response with upgrade suggestion

**Concurrent Request Protection:**
- Database transaction ensures atomic quota increment
- Row-level lock prevents race conditions
- Multiple simultaneous requests from same user are serialized

---

## 9. Error Handling & Monitoring

### 9.1. Sentry Integration

```typescript
// Sentry configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.1,
  
  // Before capture, sanitize sensitive data
  beforeSend(event) {
    // Remove API keys from error messages
    if (event.exception?.values) {
      event.exception.values.forEach(exc => {
        if (exc.value) {
          exc.value = exc.value
            .replace(/sk-[a-zA-Z0-9]+/g, '[API_KEY_REDACTED]')
            .replace(/api[_-]?key[=:]\s*[a-zA-Z0-9]+/gi, '[REDACTED]');
        }
      });
    }
    // Remove from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs.forEach(crumb => {
        if (crumb.message) {
          crumb.message = crumb.message
            .replace(/sk-[a-zA-Z0-9]+/g, '[REDACTED]');
        }
      });
    }
    return event;
  },
});

// Error capture in API routes
try {
  // API logic
} catch (error) {
  // Sanitize error message before logging
  const sanitizedMessage = error.message?.replace(/api[_-]?key[=:].*/gi, '[REDACTED]');
  Sentry.captureException(error, {
    extra: {
      sanitizedMessage,
      userId: session.user.id,
    },
  });
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

### 9.2. Error Categories

| Category | Handling | User Message |
|----------|----------|--------------|
| Search API Failure | Block proceed, alert user | "Pencarian referensi gagal. Silakan retry atau coba lagi nanti." |
| OCR Failure | Alert + allow retry/manual | "OCR gagal membaca gambar. Silakan retry atau input manual." |
| LLM API Failure | Mark status FAILED, alert | "Generasi jawaban gagal. Silakan retry." |
| Database Error | Log to Sentry, generic message | "Terjadi kesalahan sistem. Silakan coba lagi." |
| Rate Limit Exceeded | Alert quota info | "Daily quota exceeded. Upgrade to Premium for unlimited access." |

### 9.3. Retry Logic

| API | Max Retry | Delay | Fallback |
|-----|-----------|-------|----------|
| Tavily | 2 | 1s | Use Exa results only |
| Exa | 2 | 1s | Use Tavily results only |
| DeepSeek | 3 | 2s | Mark FAILED, alert user |
| OCR | 1 | 0s | Manual input |

---

## 10. Responsive Design Guidelines

### 10.1. Breakpoint Definitions

| Breakpoint | Width | Target Device |
|------------|-------|---------------|
| Mobile | < 640px | Smartphones |
| Tablet | 640px - 1024px | Tablets, small laptops |
| Desktop | > 1024px | Desktops, large screens |

### 10.2. Mobile-First Approach

**Key Adaptations:**
- Navigation: Bottom navigation bar (mobile) vs Sidebar (desktop)
- Forms: Single column layout (mobile) vs Multi-column (desktop)
- Dropzone: Touch-friendly, larger tap area
- Preview: Collapsible panels (mobile) vs Split view (desktop)
- Buttons: Full-width primary buttons (mobile)

### 10.3. Touch-Friendly OCR Upload

```typescript
// Mobile dropzone optimizations
<Dropzone
  maxSize={2 * 1024 * 1024} // 2MB
  accept={{
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  }}
  multiple={true} // Allow multiple images
  // Touch optimizations
  style={{
    minHeight: '150px', // Larger tap area
    cursor: 'pointer',
  }}
/>
```

---

## 11. Data Retention Policy

### 11.1. Auto-Purge Mechanism

**Policy:** Data auto-purge after 12 months of inactivity

**Purge Logic (Vercel Cron Job):**
```typescript
// Cron route: /api/cron/purge-data (runs monthly)

// Monthly cron job via Vercel Cron Jobs
1. Find TaskSession where created_at < 12 months ago
2. AND user has no newer sessions (all sessions older than threshold)
3. Store user_id and username in DataPurgeLog before deletion
4. Delete TaskItem records (cascade)
5. Delete TaskSession records
6. Log purge activity for audit (with username_snapshot)
```

**vercel.json configuration:**
```json
{
  "crons": [
    {
      "path": "/api/cron/purge-data",
      "schedule": "0 0 1 * *"  // Monthly on 1st at midnight
    },
    {
      "path": "/api/cron/cleanup-temp-blobs",
      "schedule": "0 3 * * *"  // Daily at 3am for temp OCR images
    }
  ]
}
```

### 11.2. In-App Notification (No Email Service)

**Pre-purge Warning:**
- Display banner on dashboard 1 month before deletion
- Banner message: "Your old task data will be deleted in 30 days. Download your PDFs before purge."
- User can dismiss banner (tracked in localStorage)
- Download all PDFs button available in banner

**User Actions:**
- User can download PDFs before purge
- User can manually delete own data anytime in settings
- No email notifications (email service not implemented)

### 11.3. Temporary Blob Cleanup

**OCR Images Cleanup:**
- Temporary OCR images uploaded during Step 1
- Auto-delete after processing complete or 24 hours
- Cron job `/api/cron/cleanup-temp-blobs` runs daily

### 11.4. Exclusions

- **User accounts:** Never auto-purged
- **StudentProfile:** Never auto-purged
- **Course:** Never auto-purged (user can manually delete)

---

## 12. Input Validation Constraints

### 12.1. Authentication

| Field | Constraint |
|-------|------------|
| Username | Min 3 chars, max 50 chars, alphanumeric + underscore |
| Password | Min 8 chars, max 100 chars, require 1 uppercase + 1 number |

### 12.2. StudentProfile

| Field | Constraint |
|-------|------------|
| full_name | Min 3 chars, max 100 chars |
| nim | Min 5 chars, max 20 chars, alphanumeric |
| university_name | Min 5 chars, max 100 chars |
| faculty | Min 3 chars, max 50 chars |
| study_program | Min 3 chars, max 50 chars |
| university_logo_url | Required, valid URL, file exists |
| pdf_font_url | Optional (nullable), if provided must be valid URL to .ttf file |
| default_min_words | Min 100, max 2000, default 300 |

### 12.3. Task Input

| Field | Constraint |
|-------|------------|
| task_type | Enum: DISCUSSION, ASSIGNMENT |
| min_words_target | Min 100, max 2000 |
| question_text | Min 10 chars, max 5000 chars per soal |
| images | Max 5 images per soal, each max 2MB, JPG/PNG/WebP |

### 12.4. Regenerate

| Constraint | Value |
|------------|-------|
| Max regenerate per TaskItem | 5 |
| Regenerate instruction text | Max 500 chars |

### 12.5. Daily Quota

| Tier | Limit |
|------|-------|
| FREE | 5 TaskSessions per day |
| PREMIUM | Unlimited (cost alerts for Admin) |

---

## 13. Security Considerations

### 13.1. API Key Protection

| Measure | Implementation |
|---------|----------------|
| Environment Variables | All API keys stored in `.env.local`, never in code |
| Sentry Sanitization | Strip API keys from error logs before capture |
| Response Filtering | Never return API keys in API responses |
| Frontend Exposure | No API keys in client-side code (all server calls) |

### 13.2. Blob Storage Access Control

| Resource | Access Strategy |
|----------|-----------------|
| University Logos | Public read (URL exposed in PDF), upload requires auth |
| User Fonts | Public read (URL exposed in PDF), upload requires auth |
| Temp OCR Images | Private, auto-delete after 24 hours |

**Note:** Vercel Blob URLs are publicly accessible by design. For sensitive uploads, implement access token validation at upload endpoint. Fonts and logos are not considered sensitive as they appear in generated PDFs.

### 13.3. Session Security

| Measure | Implementation |
|---------|----------------|
| JWT Expiration | NextAuth JWT expires after 7 days |
| Session Refresh | Automatic refresh on activity |
| Logout | Invalidate session on `/api/auth/signout` |
| HTTPS Only | All cookies marked secure |

### 13.4. Admin Login Rate Limiting

| Rule | Implementation |
|------|----------------|
| Max Attempts | 5 failed login attempts per admin account |
| Lock Duration | 15 minutes lockout after max attempts |
| Tracking Fields | `admin_login_attempts`, `admin_login_locked_until` |
| Reset | Reset on successful login |

### 13.5. Input Validation (Server-Side)

**Critical:** All client-side validation must be mirrored server-side.

| Endpoint | Server Validation Required |
|----------|---------------------------|
| `/api/auth/register` | Username uniqueness, password complexity |
| `/api/onboarding` | All profile fields per Section 12.2 |
| `/api/generate-task` | Task type enum, min words range, question length |
| `/api/regenerate` | Regenerate count < 5, quota check |
| `/api/admin/users` | Admin role check, input validation |

### 13.6. API Rate Limiting (General)

| Endpoint | Rate Limit |
|----------|------------|
| `/api/auth/*` | 10 requests per minute per IP |
| `/api/generate-task` | Limited by quota (FREE/PREMIUM) |
| `/api/admin/*` | 60 requests per minute per admin session |

---

## 14. Deployment & Environment

### 14.1. Vercel Configuration

```json
// vercel.json
{
  "regions": ["sin1"], // Singapore region (closest to Indonesia)
  "functions": {
    "app/api/generate-task/route.ts": {
      "maxDuration": 120 // Extended timeout for LLM streaming (increased from 60s)
    }
  },
  "crons": [
    {
      "path": "/api/cron/purge-data",
      "schedule": "0 0 1 * *"  // Monthly: 1st day at midnight
    },
    {
      "path": "/api/cron/cleanup-temp-blobs",
      "schedule": "0 3 * * *"  // Daily at 3am for temp OCR images
    }
  ]
}
```

### 14.2. Environment Variables

```bash
# Required environment variables
DATABASE_URL="postgres://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://nugai.vercel.app"

# Optional - Default providers (can be configured via Admin dashboard instead)
# If not set, Admin must configure providers in dashboard before app can function
DEEPSEEK_API_KEY="..."      # Optional: Pre-configured DeepSeek
TAVILY_API_KEY="..."        # Optional: Pre-configured Tavily
EXA_API_KEY="..."            # Optional: Pre-configured Exa

SENTY_DSN="..."

# Required for blob storage
VERCEL_BLOB_READ_WRITE_TOKEN="..." # For logo/font storage

# API Key Encryption (IMPORTANT)
API_KEY_ENCRYPTION_KEY="..." # 32-byte key for encrypting API keys in database
```

**Note on API Key Management:**
- API keys can be stored in environment variables OR configured via Admin dashboard
- Environment variables provide initial/default configuration
- Admin dashboard configuration overrides environment variables
- API keys in database are encrypted using `API_KEY_ENCRYPTION_KEY`
- Admin dashboard provides UI for provider management without exposing raw keys

### 14.3. Blob Storage (Vercel Blob)

**Stored Items:**
- University logos (user uploaded) - public read
- PDF fonts (Arial .ttf files) - public read, optional upload
- Temporary OCR images (auto-deleted after processing or 24h)

**Cleanup:**
- Cron job `/api/cron/cleanup-temp-blobs` deletes temp images older than 24h
- Fonts and logos are permanent (no auto-delete)

---

## 15. Appendix: File Structure

```
/nugai
├── /app
│   ├── /(auth)
│   │   ├── /login/page.tsx
│   │   ├── /onboarding/page.tsx
│   ├── /(admin)
│   │   ├── /admin/page.tsx
│   │   ├── /admin/users/page.tsx
│   │   ├── /admin/providers/page.tsx        // AI Provider configuration
│   │   ├── /admin/search-providers/page.tsx // Search API configuration
│   │   ├── /admin/analytics/page.tsx
│   ├── /(student)
│   │   ├── /dashboard/page.tsx
│   │   ├── /task/new/page.tsx (3-step wizard)
│   │   ├── /task/[id]/page.tsx (result view)
│   │   ├── /courses/page.tsx
│   │   ├── /settings/page.tsx
│   ├── /api
│   │   ├── /auth/[...nextauth]/route.ts
│   │   ├── /generate-task/route.ts
│   │   ├── /regenerate/route.ts
│   │   ├── /courses/route.ts
│   │   ├── /admin
│   │   │   ├── /users/route.ts
│   │   │   ├── /providers/route.ts              // AI Provider CRUD
│   │   │   ├── /providers/fetch-models/route.ts // Fetch models from provider
│   │   │   ├── /search-providers/route.ts       // Search API config
│   │   │   ├── /analytics/route.ts
│   │   ├── /cron/purge-data/route.ts    // Monthly data purge
│   │   ├── /cron/cleanup-temp-blobs/route.ts  // Daily blob cleanup
│   │   ├── /user/change-password/route.ts  // Self password change
│   ├── layout.tsx
│   ├── page.tsx (landing)
├── /components
│   ├── /ui (shadcn components)
│   ├── /admin
│   │   ├── UserManagement.tsx
│   │   ├── AIProviderConfig.tsx           // AI Provider configuration panel
│   │   ├── ProviderForm.tsx               // Provider form (Base URL, API Key)
│   │   ├── ModelSelector.tsx              // Model selection from fetched models
│   │   ├── SearchProviderConfig.tsx       // Tavily/Exa configuration
│   │   ├── AnalyticsDashboard.tsx
│   ├── /task
│   │   ├── TaskWizard.tsx
│   │   ├── Step1Input.tsx
│   │   ├── Step2Processing.tsx
│   │   ├── Step3Result.tsx
│   │   ├── OCRDropzone.tsx
│   ├── /pdf
│   │   ├── DiscussionTemplate.tsx
│   │   ├── AssignmentTemplate.tsx
│   │   ├── CoverPage.tsx
├── /lib
│   ├── prisma.ts
│   ├── auth.ts
│   ├── ai.ts (OpenAI-compatible provider integration)
│   ├── provider.ts (AIProvider & SearchProvider management)
│   ├── encryption.ts (API key encryption/decryption)
│   ├── search.ts (Tavily, Exa)
│   ├── ocr.ts (Tesseract.js)
│   ├── pdf.ts (@react-pdf/renderer)
├── /prisma
│   ├── schema.prisma
│   ├── /migrations
├── /styles
│   ├── globals.css
│   ├── fonts.css (Space Grotesk)
├── /public
│   ├── /fonts (Arial .ttf files - DEFAULT if user doesn't upload)
│   │   ├── Arial-Regular.ttf
│   │   ├── Arial-Bold.ttf
│   │   ├── Arial-Italic.ttf
│   ├── logo-placeholder.png
├── .env.local
├── next.config.js
├── tailwind.config.js
├── sentry.client.config.ts
├── sentry.server.config.ts
```

---

## 16. Appendix: Glossary

| Term | Definition |
|------|------------|
| TaskSession | One wizard session containing multiple TaskItems |
| TaskItem | Single question + answer pair |
| Tugas Diskusi | Discussion assignment (narrative essay format) |
| Tugas Soal | Problem assignment (makalah/structured paper format) |
| OCR | Optical Character Recognition (image to text) |
| Humanized | Natural writing style, non-robotic AI output |
| Contextual Memory | User profile data injected into AI prompt |
| UPBJJ | Unit Program Belajar Jarak Jauh (UT branch) |

---

**Document Version:** Final v3.0 (Multi-Provider Architecture)
**Last Updated:** April 2026
**Status:** Ready for Implementation
**Changes from v2.0:**
- Changed from DeepSeek-only to multi-provider architecture
- Added OpenAI-compatible API support (DeepSeek, OpenAI, Groq, Together AI, Custom)
- Added AIProvider table for provider configuration management
- Added SearchProvider table for Tavily/Exa configuration
- API keys now managed via Admin dashboard (encrypted in database)
- Added preset providers with pre-configured base URLs
- Added model fetch flow from provider endpoint
- Admin dashboard now includes AI Provider and Search Provider configuration panels
- Environment variables for API keys changed to optional (can be configured via dashboard)
- Added API_KEY_ENCRYPTION_KEY for secure storage
- Updated file structure with new provider management files