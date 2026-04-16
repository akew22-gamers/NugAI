# Technical Product Requirements Document (PRD) 

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

---

## 3. Tech Stack & Dependencies
Dokumen ini mengamanatkan penggunaan teknologi berikut (Penting untuk AI Coding Agent):
* **Core:** Next.js (App Router), React, TypeScript.
* **Styling:** Tailwind CSS, `shadcn/ui` (Komponen UI, Form, Dialog, Dropdown), `sonner` (Toaster Notification).
* **Database:** Vercel Postgres (Relational DB).
* **ORM:** Prisma (Direkomendasikan untuk relasi kompleks) atau Drizzle.
* **Authentication:** NextAuth.js v5 (Auth.js) - `CredentialsProvider`.
* **AI SDK:** Vercel AI SDK (`ai`, `@ai-sdk/openai` dsb untuk *streaming response*).
* **LLM Provider:** DeepSeek API (Sebagai *engine* utama).
* **Search/Research API:** `tavily-search` SDK dan Exa API SDK.
* **OCR Engine:** `tesseract.js` (Client-side processing).
* **PDF Generation:** `@react-pdf/renderer` (Server/Client side rendering dengan custom font embedding).

---

## 4. Database Schema (Entity Relationship)
*AI Agent Note: Gunakan relasi di bawah ini untuk membentuk Prisma Schema.*

### 4.1. `User` Table
Menyimpan kredensial login.
* `id` (UUID, PK)
* `username` (String, Unique)
* `password` (String, Hashed)
* `role` (Enum: `ADMIN`, `STUDENT`)
* `created_at` (Timestamp)

### 4.2. `StudentProfile` Table
Menyimpan data statis untuk *Contextual Memory* dan Cover PDF. (One-to-One dengan User).
* `id` (UUID, PK)
* `user_id` (UUID, FK -> User.id)
* `full_name` (String)
* `nim` (String)
* `university_name` (String)
* `faculty` (String)
* `study_program` (String)
* `upbjj_branch` (String, Nullable)
* `university_logo_url` (String/Text, URL ke Vercel Blob/Supabase Storage)
* `default_min_words` (Int, Default: misal 300)
* `default_tone` (String, Default: "Bahasa Indonesia Baku Semi-Formal")

### 4.3. `Course` Table (Master Data Mata Kuliah)
Menyimpan *library* mata kuliah milik masing-masing user. (One-to-Many dari User).
* `id` (UUID, PK)
* `user_id` (UUID, FK -> User.id)
* `course_name` (String)
* `module_book_title` (String)
* `tutor_name` (String)

### 4.4. `TaskSession` Table
Menyimpan *metadata* dari satu sesi pengerjaan tugas (*wizard*).
* `id` (UUID, PK)
* `user_id` (UUID, FK -> User.id)
* `course_id` (UUID, FK -> Course.id, Nullable jika input manual)
* `task_type` (Enum: `DISCUSSION`, `ASSIGNMENT`)
* `min_words_target` (Int)
* `created_at` (Timestamp)

### 4.5. `TaskItem` Table
Menyimpan detail per-nomor soal beserta jawaban dan referensinya. (One-to-Many dari TaskSession).
* `id` (UUID, PK)
* `session_id` (UUID, FK -> TaskSession.id)
* `question_text` (Text)
* `answer_text` (Text, hasil *generate* AI)
* `references_used` (JSON, menyimpan metadata referensi web/buku)
* `status` (Enum: `GENERATING`, `COMPLETED`, `FAILED`)

---

## 5. User Flow & Core Features

### 5.1. Authentication & Onboarding Flow
1.  **Secret Admin Login:** Akses via rute tersembunyi (misal `/admin/secret-login`). Admin menambahkan *username* dan *password* untuk mahasiswa.
2.  **Student Login:** User login. *Middleware* mengecek relasi `User` ke `StudentProfile`.
3.  **Onboarding Intercept:** Jika `StudentProfile` kosong, *redirect* paksa ke `/onboarding`. User wajib mengisi form: Nama, NIM, Univ, Fakultas, Prodi, UPBJJ, dan *Upload Logo*. Tidak bisa akses *dashboard* sebelum data lengkap.

### 5.2. Task Generation Flow (The 3-Step Wizard)

**STEP 1: Input & Context Setup (Client-Side State)**
* **UI Components:** Gunakan komponen `Tabs` atau `RadioGroup` untuk Jenis Tugas. Gunakan `Combobox` untuk Mata Kuliah.
* **Logic Mata Kuliah:**
    * Ambil data dari tabel `Course`.
    * Jika dipilih, *auto-fill* teks "Judul Modul" dan "Nama Tutor".
    * Sediakan tombol "Tambah Manual" untuk input temporer.
* **Logic Panjang Jawaban:**
    * *Auto-fill* menggunakan field `default_min_words` dari `StudentProfile`.
    * Bisa diubah manual oleh user berupa *number input*.
* **Input Soal (Tesseract.js integration):**
    * Sediakan `<textarea>` untuk teks.
    * Sediakan *Dropzone* untuk gambar. Saat gambar di-*drop*, jalankan OCR lokal, tempel hasilnya ke *textarea*.

**STEP 2: Processing & Research Pipeline (Server-Side Logic)**
* Kirim *payload* ke Next.js API Route (e.g., `/api/generate-task`).
* **Phase 1 (Search):**
    * Ekstrak kata kunci dari soal dan "Judul Modul".
    * Lakukan *fetch* ke Tavily API (Untuk fakta umum) & Exa API (Untuk jurnal/buku).
    * *Fallback Strategy:* Jika Exa/Tavily limit/error, gunakan *scraper* standar.
* **Phase 2 (Context Assembly):** Gabungkan hasil riset ke dalam *System Prompt*.
* **Phase 3 (Streaming LLM):** Panggil DeepSeek API via Vercel AI SDK (`streamText`).

**STEP 3: Result & Persistent Storage**
* Tampilkan aliran teks (MD/HTML) ke layar.
* Saat *stream* selesai (`onFinish` *callback*), simpan data ke `TaskSession` dan `TaskItem` via Prisma.
* Tampilkan tombol **"Regenerate"** dan **"Download PDF"**.

### 5.3. Regenerate Engine (Threaded Context)
* **Trigger:** User mengklik "Regenerate" dan mengisi *text input* opsional "Instruksi Perbaikan".
* **Payload ke API:** `[Soal] + [Hasil Riset Sebelumnya] + [Jawaban Terakhir] + [Instruksi Perbaikan]`.
* **Prompt Override:** AI diinstruksikan untuk merevisi jawaban terakhir berdasarkan *feedback*, bukan membuat baru dari nol tanpa mengingat kesalahan sebelumnya.

---

## 6. AI Prompt Engineering & Logic Constraints

*AI Agent Note: Variabel di bawah ini harus diinjeksi secara dinamis ke dalam parameter `system` pada pemanggilan model AI.*

1.  **Contextual Persona:** `Kamu adalah mahasiswa tingkat sarjana program studi {study_program} di {university_name}. Jawab pertanyaan akademik ini sesuai bidang studimu.`
2.  **Language & Tone:** `Wajib menggunakan Bahasa Indonesia Baku Semi-Formal. Hindari kata-kata robotik, transisi klise AI (seperti 'Selain itu', 'Kesimpulannya'), atau bahasa gaul/slang.`
3.  **Word Count Constraint:** `Jawaban HARUS MEMILIKI MINIMAL {min_words_target} KATA. Diizinkan melebihi target minimal ini (buffer +2% hingga +15%) untuk menjaga kelengkapan dan logika kalimat agar tidak terpotong.`
4.  **Reference Mandate:** `Wajib menggunakan dan mencantumkan 2 referensi pada akhir jawaban setiap nomor soal: 1) Modul Utama: {module_book_title}. 2) Satu referensi kredibel dari hasil web search (Jurnal/Buku/Aturan Pemerintah).`

---

## 7. Document Generation Requirements (PDF Strict Formatting)
Menggunakan `@react-pdf/renderer` dengan *custom font registration*. Dokumen wajib menyertakan atribut *developer* NugAI by EAS Creative Studio di area metadata atau footer (opsional, sesuai desain).

**Global Document Styles:**
* Page Size: `A4`
* Padding/Margin: `2.5cm` (Semua sisi).
* Font Family: `Arial` (Load `.ttf` file: Regular, Bold, Italic, Underline).
* Line Height: `1.15`.
* Font Size: Body `12pt`, Headers `14pt`.

**Template A: Tugas Diskusi**
1.  **Opening:** Salam pembuka ("Assalamualaikum...", "Selamat pagi/siang/sore teman-teman dan Bapak/Ibu Tutor").
2.  **Body:** Isi jawaban.
3.  **Closing:** Simpulan singkat + Salam penutup ("Semoga jawaban ini bermanfaat...").
4.  **Daftar Referensi (Diurutkan di bawah):**
    * *Modul:* `[Penulis]. [Tahun]. [Judul Modul] (Italic). [Penerbit].`
    * *Jurnal:* `[Nama]. ([Tahun]). [Judul Artikel]. [Nama Jurnal] (Italic), [Vol](No), [Hal].`

**Template B: Tugas Soal (Makalah)**
* **Halaman 1 (Cover Center Aligned):**
    * Top: Judul "TUGAS TUTORIAL" & "MATA KULIAH [Nama Matkul]" (Bold, 14pt).
    * Middle: Komponen `<Image>` untuk `university_logo_url` (Width/Height proporsional).
    * Tutor Info: "TUTOR PEMBIMBING" -> `[Nama Tutor]`.
    * Student Info: "DISUSUN OLEH" -> `[Nama]` | `[NIM]`.
    * Bottom: `[Prodi]`, `[Fakultas]`, `[UPBJJ]`, `[Universitas]` (Bold, 14pt).
* **Halaman 2:** Daftar semua soal yang diinput.
* **Halaman 3 & Seterusnya:** Judul "JAWABAN". Diikuti struktur per-soal: Nomor Soal -> Jawaban -> Daftar Referensi spesifik untuk soal tersebut.
