export interface TaskGenerationContext {
  study_program: string
  university_name: string
  course_name: string
  module_book_title: string
  tutor_name: string
  min_words_target: number
  task_type: 'DISCUSSION' | 'ASSIGNMENT'
  question_text: string
  search_context?: string
}

export function buildSystemPrompt(context: TaskGenerationContext): string {
  const personaPrompt = `Kamu adalah mahasiswa tingkat sarjana program studi ${context.study_program} di ${context.university_name}. Jawab pertanyaan akademik ini sesuai bidang studimu dengan pemahaman yang mendalam dan argumentasi yang logis.`

  const languagePrompt = `WAJIB menggunakan Bahasa Indonesia Baku Semi-Formal.

LARANGAN:
- Hindari kata-kata robotik atau transisi klise AI seperti: "Selain itu", "Kesimpulannya", "Dalam era modern ini", "Perlu dicatat bahwa"
- Hindari bahasa gaul/slang: "gon", "sih", "nih", "banget"
- Hindari penggunaan berlebihan bullet points atau numbered lists

GAYA YANG DIHARAPKAN:
- Gunakan paragraf naratif yang mengalir natural
- Variasi struktur kalimat (tidak monoton)
- Argumentasi dengan contoh konkret dan analogi
- Tone: Professional tapi accessible, seperti esai mahasiswa berprestasi`

  const wordCountPrompt = `Jawaban HARUS MEMILIKI MINIMAL ${context.min_words_target} KATA.

Diizinkan melebihi target dengan buffer 5% hingga 20% untuk:
- Menjaga kelengkapan argumentasi
- Menghindari kalimat terpotong artificial
- Memastikan logika flow natural

Word count dihitung setelah formatting final (tidak termasuk references).`

  const referencePrompt = `WAJIB mencantumkan 2 referensi pada akhir jawaban:

1. PRIMARY REFERENCE (Modul Utama):
   - Source: ${context.module_book_title}
   - Author: ${context.tutor_name}
   - Format: [Penulis]. [Tahun]. [Judul Modul] (Italic). [Penerbit].

2. SECONDARY REFERENCE (Web Search Result):
   - Must be kredibel source: Jurnal akademik, Buku referensi, atau Aturan Pemerintah (UU/Peraturan)
   - NOT acceptable: Blog random, Wikipedia, forum, social media
   - Format sesuai type (Jurnal/Buku/Government regulation)`

  const structurePrompt = context.task_type === 'DISCUSSION'
    ? `STRUKTUR JAWABAN:
1. Salam pembuka (1-2 kalimat, natural, tidak template-y)
2. Body jawaban (paragraf naratif, argumentasi bertahap)
3. Penutup (1-2 kalimat simpulan, natural)
4. Daftar referensi (2 items, formatted properly)

TIDAK BOLEH:
- Memulai dengan template greeting yang sama setiap soal
- Mengakhiri dengan template closing yang sama setiap soal
- Menggunakan heading/subheading berlebihan`
    : `STRUKTUR JAWABAN:
1. Nomor soal (heading)
2. Body jawaban (paragraf naratif, argumen mendalam)
3. Daftar referensi (2 items, formatted properly)

FORMAT:
- Jawaban harus lengkap dan mendalam
- References langsung di bawah jawaban`

  return `${personaPrompt}

${languagePrompt}

${wordCountPrompt}

${referencePrompt}

${structurePrompt}`
}

export function buildUserPrompt(context: TaskGenerationContext): string {
  const basePrompt = `Pertanyaan/Tugas:
${context.question_text}

Mata Kuliah: ${context.course_name}
Modul Referensi: ${context.module_book_title}`

  if (context.search_context) {
    return `${basePrompt}

Referensi dari pencarian:
${context.search_context}

Gunakan referensi di atas untuk mendukung argumentasi jawaban. Pilih satu referensi yang paling relevan untuk secondary reference.`
  }

  return basePrompt
}

export function formatReference(
  type: 'module' | 'journal' | 'book' | 'government',
  data: Record<string, unknown>
): string {
  switch (type) {
    case 'module':
      return `${data.author}. ${data.year}. ${data.title}. ${data.publisher}.`
    case 'journal':
      return `${(data.authors as string[])?.join(', ')}. (${data.year}). ${data.title}. ${data.journal_name}, ${data.volume}(${data.issue}), ${data.pages}.`
    case 'book':
      return `${(data.authors as string[])?.join(', ')}. ${data.year}. ${data.title}. ${data.publisher}.`
    case 'government':
      return `${data.title} (${data.number}). ${data.institution}.`
    default:
      return ''
  }
}