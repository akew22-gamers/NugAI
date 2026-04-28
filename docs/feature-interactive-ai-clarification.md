# Feature Plan: Interactive AI Clarification

> **Status**: PLANNED (Belum diimplementasi)  
> **Prioritas**: Opsional — Evaluasi setelah fitur Answer Style Settings berjalan 2-4 minggu  
> **Tanggal dibuat**: 2026-04-28  
> **Kompleksitas**: Sedang-Tinggi  
> **Estimasi biaya tambahan per request**: ~$0.0005 (200-500 token input + ~200 token output)

---

## 1. Ringkasan

Fitur ini menambahkan **fase analisis** sebelum AI generate jawaban. Alih-alih langsung generate, AI akan membaca soal terlebih dahulu, mengidentifikasi hal-hal yang ambigu atau perlu dikonfirmasi, lalu menampilkan popup dengan pertanyaan/opsi yang bisa user klik sebelum jawaban di-generate.

### Alur Baru (Step 2)

```
Step 1 (Input Soal)
    ↓
Step 2 Fase 1: AI Analisis Soal (~2-4 detik)
    ↓
    ├── needsClarification = true  → Popup Konfirmasi (user pilih opsi)
    │                                    ↓
    │                               Step 2 Fase 2: AI Generate Jawaban
    │
    └── needsClarification = false → Step 2 Fase 2: AI Generate Jawaban (langsung, skip popup)
    ↓
Step 3 (Hasil Jawaban)
```

### Prasyarat

Fitur ini merupakan **evolusi lanjutan** dari fitur yang sudah diimplementasi:
- ✅ Answer Style Settings (4 opsi gaya jawaban)
- ✅ Switch Deskripsi PDF
- ✅ AI Preamble Stripping

Fitur ini menjadi **opsional** di halaman Settings — user bisa memilih:
- **Mode Manual**: Menggunakan Answer Style Settings di Step 1 (default)
- **Mode Interactive**: AI analisis soal → popup konfirmasi → generate

---

## 2. Kapan Harus Diimplementasi

Implementasi fitur ini **direkomendasikan** jika:

1. **Regenerate rate masih tinggi** setelah Answer Style Settings berjalan 2-4 minggu
2. **User feedback** menunjukkan jawaban masih sering tidak sesuai ekspektasi
3. **User base sudah cukup besar** untuk justify biaya API tambahan
4. **Biaya API bukan concern utama** (setiap clarification = 1 API call tambahan)

---

## 3. Arsitektur Teknis

### 3.1 API Route Baru

**`POST /api/analyze-task`** — Fase analisis soal

```typescript
// Request
interface AnalyzeTaskRequest {
  task_type: 'DISCUSSION' | 'ASSIGNMENT'
  task_description: string
  course_name: string
  module_book_title: string
  questions: string[]
}

// Response
interface AnalyzeTaskResponse {
  needsClarification: boolean
  summary: string // Ringkasan pemahaman AI tentang soal
  questions: ClarificationQuestion[]
}

interface ClarificationQuestion {
  id: string // e.g. "answer_style", "approach", "depth"
  question: string
  options: ClarificationOption[]
  default: string // value dari opsi default
}

interface ClarificationOption {
  value: string
  label: string
  description: string
}
```

### 3.2 Contoh Response AI

```json
{
  "needsClarification": true,
  "summary": "Soal ini membahas tentang teori manajemen strategis dan penerapannya dalam organisasi modern.",
  "questions": [
    {
      "id": "answer_style",
      "question": "Soal ini bisa dijawab dengan beberapa format:",
      "options": [
        {
          "value": "paragraph",
          "label": "Paragraf naratif",
          "description": "Jawaban mengalir dalam paragraf seperti esai"
        },
        {
          "value": "bullet",
          "label": "Poin-poin terstruktur",
          "description": "Jawaban dengan numbering yang rapi"
        },
        {
          "value": "combination",
          "label": "Kombinasi",
          "description": "Paragraf pengantar + poin-poin + kesimpulan"
        }
      ],
      "default": "combination"
    },
    {
      "id": "approach",
      "question": "Pendekatan jawaban yang diinginkan:",
      "options": [
        {
          "value": "theoretical",
          "label": "Teoritis",
          "description": "Fokus pada teori dan konsep akademik"
        },
        {
          "value": "practical",
          "label": "Praktis + Contoh",
          "description": "Teori disertai contoh nyata dan studi kasus"
        }
      ],
      "default": "practical"
    }
  ]
}
```

### 3.3 Kategori Pertanyaan yang Bisa Diajukan AI

| Kategori | ID | Contoh Pertanyaan | Kapan Muncul |
|----------|-----|-------------------|-------------|
| Gaya Jawaban | `answer_style` | "Format jawaban yang diinginkan:" | Selalu (jika soal bisa dijawab multi-format) |
| Kedalaman | `depth` | "Seberapa dalam pembahasan:" | Soal yang luas/open-ended |
| Pendekatan | `approach` | "Pendekatan jawaban:" | Soal yang bisa dijawab dari berbagai sudut |
| Format Matematika | `math_format` | "Format penyelesaian:" | Soal mengandung perhitungan |
| Referensi | `reference_style` | "Preferensi sumber referensi:" | Soal yang butuh banyak referensi |
| Bahasa | `language_tone` | "Tingkat formalitas bahasa:" | Opsional |

> **Aturan**: Maksimal **3 pertanyaan** per analisis. Lebih dari itu = user fatigue.

---

## 4. File yang Perlu Dibuat/Dimodifikasi

### File Baru

| File | Deskripsi |
|------|-----------|
| `app/api/analyze-task/route.ts` | API route untuk fase analisis soal |
| `lib/prompts/task-analysis.ts` | Prompt template untuk analisis soal (return JSON) |
| `components/task/ClarificationModal.tsx` | Modal popup dengan pertanyaan/opsi dari AI |

### File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `components/task/Step2Processing.tsx` | Tambah state machine: ANALYZING → CLARIFYING → GENERATING |
| `components/task/TaskWizard.tsx` | Handle clarification state dan pass preferences ke generate |
| `app/api/generate-task/route.ts` | Terima `clarification_preferences` parameter tambahan |
| `lib/prompts/task-generation.ts` | Inject clarification preferences ke prompt |
| `app/(student)/settings/page.tsx` | Tambah toggle "Mode Interactive AI Clarification" |
| `prisma/schema.prisma` | Tambah field `use_interactive_clarification` di StudentProfile (Boolean, default false) |

---

## 5. Prompt untuk Fase Analisis

```typescript
// lib/prompts/task-analysis.ts

export function buildAnalysisPrompt(context: AnalysisContext): string {
  return `Kamu adalah asisten AI yang bertugas menganalisis soal/tugas akademik.

TUGAS:
Baca dan pahami soal berikut, lalu tentukan apakah ada hal yang perlu dikonfirmasi ke user sebelum menjawab.

KONTEKS:
- Mata Kuliah: ${context.course_name}
- Buku/Modul: ${context.module_book_title}
- Tipe Tugas: ${context.task_type}

SOAL:
${context.questions.join('\n\n')}

${context.task_description ? `DESKRIPSI/CERITA SOAL:\n${context.task_description}` : ''}

INSTRUKSI:
1. Analisis soal di atas
2. Tentukan apakah ada ambiguitas atau pilihan yang perlu dikonfirmasi user
3. Jika soal sudah jelas dan straightforward, set needsClarification = false
4. Jika ada hal yang perlu dikonfirmasi, buat MAKSIMAL 3 pertanyaan
5. Setiap pertanyaan harus punya 2-4 opsi yang jelas dan berbeda
6. Pilih default yang paling umum/standar untuk setiap pertanyaan

ATURAN PENTING:
- JANGAN tanyakan hal yang sudah jelas dari soal
- JANGAN tanyakan hal yang trivial
- Fokus pada hal yang BENAR-BENAR mempengaruhi kualitas jawaban
- Pertanyaan harus dalam Bahasa Indonesia
- Soal sederhana/pendek biasanya TIDAK perlu clarification

RESPONSE FORMAT (JSON ONLY, tanpa markdown code block):
{
  "needsClarification": boolean,
  "summary": "Ringkasan singkat pemahaman soal (1-2 kalimat)",
  "questions": [
    {
      "id": "string (answer_style|approach|depth|math_format|reference_style|language_tone)",
      "question": "Pertanyaan untuk user",
      "options": [
        { "value": "string", "label": "Label singkat", "description": "Penjelasan opsi" }
      ],
      "default": "value dari opsi default"
    }
  ]
}`
}
```

---

## 6. Komponen UI: ClarificationModal

```
┌─────────────────────────────────────────────┐
│  🔍 AI telah menganalisis soal Anda         │
│                                             │
│  "Soal ini membahas tentang teori           │
│   manajemen strategis..."                   │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  1. Format jawaban yang diinginkan:         │
│     ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│     │ Paragraf  │ │  Poin    │ │Kombinasi│  │
│     │ (selected)│ │          │ │         │  │
│     └──────────┘ └──────────┘ └─────────┘  │
│                                             │
│  2. Pendekatan jawaban:                     │
│     ┌──────────┐ ┌──────────────┐           │
│     │ Teoritis │ │Praktis+Contoh│           │
│     │          │ │  (selected)  │           │
│     └──────────┘ └──────────────┘           │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  [Skip, Langsung Generate]  [✓ Lanjutkan]   │
│                                             │
└─────────────────────────────────────────────┘
```

### Spesifikasi UI:
- **Header**: Icon 🔍 + "AI telah menganalisis soal Anda"
- **Summary**: Teks ringkasan dari AI (italic, text-zinc-500)
- **Questions**: Setiap pertanyaan = label + chip/card selector
- **Selected state**: Border purple + bg purple-50 (konsisten dengan Answer Style di Step1)
- **Footer buttons**:
  - "Skip, Langsung Generate" (variant outline, text-zinc-500)
  - "Lanjutkan Generate" (variant primary, bg-purple-600)
- **Loading state**: "🔍 AI sedang membaca dan memahami soal..." dengan spinner

---

## 7. Step 2 State Machine

```
┌──────────┐     ┌────────────┐     ┌────────────┐     ┌──────┐
│ANALYZING │────→│ CLARIFYING │────→│ GENERATING │────→│ DONE │
│(API call)│     │  (popup)   │     │ (API call) │     │      │
└──────────┘     └────────────┘     └────────────┘     └──────┘
      │                                    ↑
      │    needsClarification = false       │
      └────────────────────────────────────┘
```

### State transitions:
1. `ANALYZING`: Call `/api/analyze-task` → loading "AI sedang menganalisis soal..."
2. `CLARIFYING`: Tampilkan ClarificationModal (hanya jika `needsClarification = true`)
3. `GENERATING`: Call `/api/generate-task` dengan preferences dari clarification
4. `DONE`: Tampilkan hasil (Step 3)

---

## 8. Settings Integration

### Halaman Settings (`/settings`)

Tambah section baru:

```
┌─────────────────────────────────────────────┐
│  Preferensi AI                              │
│                                             │
│  Mode Generate Jawaban                      │
│  ┌─────────────────────────────────────┐    │
│  │ ○ Manual (Default)                  │    │
│  │   Pilih gaya jawaban di Step 1      │    │
│  │                                     │    │
│  │ ○ Interactive AI Clarification      │    │
│  │   AI analisis soal → konfirmasi →   │    │
│  │   generate (lebih akurat, +2-4 dtk) │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [Simpan Perubahan]                         │
└─────────────────────────────────────────────┘
```

### Database:
```prisma
model StudentProfile {
  // ... existing fields
  use_interactive_clarification Boolean @default(false)
}
```

---

## 9. Estimasi Biaya & Performa

| Aspek | Detail |
|-------|--------|
| Token input (analisis) | ~200-500 token |
| Token output (analisis) | ~150-300 token (JSON response) |
| Biaya per analisis | ~$0.0003-0.0008 (tergantung provider) |
| Waktu tambahan | ~2-4 detik (1 API call ekstra) |
| Impact ke UX | Positif — jawaban lebih sesuai ekspektasi |
| Impact ke regenerate rate | Diperkirakan turun 30-50% |

### Perbandingan biaya:

| Skenario | Biaya per task |
|----------|---------------|
| Tanpa clarification | 1 generate call = ~$0.01-0.03 |
| Dengan clarification | 1 analyze + 1 generate = ~$0.01-0.03 + $0.0005 |
| Tanpa clarification + 1 regenerate | 1 generate + 1 regenerate = ~$0.02-0.06 |

> **Kesimpulan**: Biaya clarification jauh lebih murah daripada 1x regenerate. Jika fitur ini berhasil mengurangi regenerate, justru **menghemat biaya**.

---

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| AI salah analisis / pertanyaan tidak relevan | Tombol "Skip" selalu tersedia |
| User fatigue (terlalu banyak pertanyaan) | Max 3 pertanyaan, soal sederhana auto-skip |
| Biaya API tambahan | Toggle di Settings, default OFF |
| Latency tambahan | Loading state informatif, ~2-4 detik acceptable |
| AI tidak return valid JSON | Try-catch + fallback ke direct generate |

---

## 11. Checklist Implementasi

- [ ] Buat `lib/prompts/task-analysis.ts` (prompt template)
- [ ] Buat `app/api/analyze-task/route.ts` (API route)
- [ ] Buat `components/task/ClarificationModal.tsx` (UI modal)
- [ ] Modifikasi `components/task/Step2Processing.tsx` (state machine)
- [ ] Modifikasi `components/task/TaskWizard.tsx` (handle clarification flow)
- [ ] Modifikasi `app/api/generate-task/route.ts` (terima preferences)
- [ ] Modifikasi `lib/prompts/task-generation.ts` (inject preferences)
- [ ] Tambah field `use_interactive_clarification` di `prisma/schema.prisma`
- [ ] Modifikasi `app/(student)/settings/page.tsx` (toggle setting)
- [ ] Modifikasi `app/api/profile/route.ts` (save/load setting)
- [ ] Testing end-to-end
- [ ] Update `codebase.md`

---

## 12. Timeline Estimasi

| Fase | Durasi |
|------|--------|
| Prompt engineering & testing | 1-2 jam |
| API route + backend | 1-2 jam |
| UI modal + Step 2 flow | 2-3 jam |
| Settings integration | 30 menit |
| Testing & debugging | 1-2 jam |
| **Total** | **5-9 jam** |

---

*Dokumen ini akan diupdate seiring perkembangan evaluasi fitur Answer Style Settings dan feedback user.*
