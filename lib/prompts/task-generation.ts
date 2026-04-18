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
  student_name?: string
  student_nim?: string
}

export function buildSystemPrompt(context: TaskGenerationContext): string {
  const maxWords = Math.ceil(context.min_words_target * 1.05)
  
  const personaPrompt = `Kamu adalah mahasiswa tingkat sarjana program studi ${context.study_program} di ${context.university_name}. Jawab pertanyaan akademik ini sesuai bidang studimu dengan pemahaman yang mendalam dan argumentasi yang logis. WAJIB TULIS NAMA LENGKAP DAN NIM MAHASISWA DI AWAL JAWABAN untuk jenis tugas DISCUSSION. Nama dan NIM akan disediakan dalam user prompt.`
  
  const languagePrompt = `WAJIB menggunakan Bahasa Indonesia Bako Semi-Formal.

LARANGAN:
- Hindari kata-kata robotik atau transisi klise AI seperti: "Selain itu", "Kesimpulannya", "Dalam era modern ini", "Perlu dicatat bahwa"
- Hindari bahasa gaul/slang: "gon", "sih", "nih", "banget"
- Hindari penggunaan berlebihan bullet points atau numbered lists
- JANGAN gunakan simbol atau karakter aneh seperti asterisk (*), bullet (•), atau formatting marks
- Tulis referensi dengan format natural tanpa simbol khusus
- JANGAN PERNAH memotong jawaban di tengah kalimat - jawaban harus LENGKAP dan UTUH

GAYA YANG DIHARAPKAN:
- Gunakan paragraf naratif yang mengalir natural
- Variasi struktur kalimat (tidak monoton)
- Argumentasi dengan contoh konkret dan analogi
- Tone: Professional tapi accessible, seperti esai mahasiswa berprestasi
- Tulis referensi dengan format sederhana: nomor, judul, sumber`

  const wordCountPrompt = `ATURAN KATA KRITIS:
- Target kata BODY (isi jawaban): ${context.min_words_target} kata
- Maksimal kata BODY: ${maxWords} kata (${context.min_words_target} + 5% toleransi)
- BODY = paragraf argumentasi utama (SALAM PEMBUKA + ISI + PENUTUP)
- TIDAK TERMASUK: Header "Nama/NIM" dan bagian "Referensi"
- JAWABAN HARUS LENGKAP - tidak boleh terpotong di tengah kalimat
- Jika mendekati batas maksimal ${maxWords} kata, prioritaskan PENUTUP yang singkat tapi kuat
- TIDAK BOLEH kurang dari ${context.min_words_target} kata untuk BODY
- TIDAK BOLEH lebih dari ${maxWords} kata untuk BODY (5% toleransi maksimal)`

  const referencePrompt = `WAJIB tulis REFERENSI di AKHIR jawaban.

Format referensi yang diharapkan:

Referensi:

1. ${context.module_book_title}. ${context.university_name}.
2. [Judul Buku/Jurnal dari sumber eksternal]. [Tahun]. [Penerbit/Sumber].

PENTING:
- Referensi ke-1 adalah modul/buku referensi dari ${context.university_name} - TULIS JUDUL MODUL, bukan nama tutor
- Referensi ke-2 HARUS dari SUMBER DI LUAR ${context.university_name}
- Jangan gunakan simbol seperti asterisk (*) atau bullet (•)
- Tulis dengan format sederhana: nomor, judul, sumber/tahun
- Hindari formatting yang terlihat seperti output AI

Referensi harus RELEVAN dengan isi jawaban dan DIGUNAKAN dalam argumentasi.`

  const structurePrompt = context.task_type === 'DISCUSSION'
    ? `STRUKTUR JAWABAN DISCUSSION:
1. HEADER DATA MAHASISWA (WAJIB di awal, tidak dihitung word count):
   Nama: [Nama Lengkap Mahasiswa]
   NIM: [NIM Mahasiswa]
   (lalu spasi)
   
2. SALAM PEMBUKA (1-2 kalimat natural, termasuk word count BODY)

3. BODY JAWABAN (${context.min_words_target}-${maxWords} kata)
   - Paragraf argumentasi bertahap
   - Jelaskan konsep/poin utama
   - Berikan contoh konkret
   - Analisis dan argumentasi
   - PASTIKAN LENGKAP - tidak terpotong
   
4. PENUTUP (1-2 kalimat simpulan natural, termasuk word count BODY)

5. REFERENSI (tidak dihitung word count)
   - Tulis langsung di akhir jawaban
   - Format: Referensi: [lalu list nomor 1 dan 2]

WORD COUNT BODY = Salam Pembuka + Body Jawaban + Penutup
Tidak termasuk Header Nama/NIM dan Referensi.`
    : `STRUKTUR JAWABAN ASSIGNMENT/SOAL:
1. BODY JAWABAN (${context.min_words_target}-${maxWords} kata)
   - Paragraf naratif mendalam
   - Jawab langsung dan lengkap
   - Argumentasi dengan bukti/referensi
   - PASTIKAN LENGKAP - tidak terpotong
   
2. REFERENSI (tidak dihitung word count)
   - Tulis langsung setelah body
   - Format natural: Referensi: [nomor 1 dan 2]
   - Tanpa simbol formatting

WORD COUNT = seluruh isi jawaban (tidak termasuk Referensi).`

  return `${personaPrompt}

${languagePrompt}

${wordCountPrompt}

${referencePrompt}

${structurePrompt}`
}

export function buildUserPrompt(context: TaskGenerationContext): string {
  const maxWords = Math.ceil(context.min_words_target * 1.05)
  
  const studentDataPrompt = context.task_type === 'DISCUSSION' && context.student_name && context.student_nim
    ? `DATA MAHASISWA (WAJIB tulis di awal jawaban):
Nama: ${context.student_name}
NIM: ${context.student_nim}

`
    : ''

  const basePrompt = `${studentDataPrompt}Pertanyaan/Tugas:
${context.question_text}

Mata Kuliah: ${context.course_name}
Modul Referensi: ${context.module_book_title}
Tutor Pembimbing: ${context.tutor_name}
Target Kata BODY: ${context.min_words_target}-${maxWords} kata (5% toleransi)

INSTRUKSI KRITIS:
1. BODY jawaban harus ${context.min_words_target}-${maxWords} kata (tidak kurang, tidak lebih dari 5% toleransi)
2. BODY = Salam Pembuka + Isi Argumentasi + Penutup (tidak termasuk Header Nama/NIM dan Referensi)
3. JAWABAN HARUS LENGKAP - tidak boleh terpotong di tengah kalimat
4. Tulis Referensi DI AKHIR (tidak dihitung word count)
5. Referensi ke-1: tulis judul modul "${context.module_book_title}" dari ${context.university_name}
6. Referensi ke-2: dari sumber DI LUAR ${context.university_name}
7. JANGAN gunakan simbol atau karakter aneh`

  if (context.search_context) {
    return `${basePrompt}

INFORMASI dari pencarian web (gunakan untuk referensi ke-2 jika relevan):
${context.search_context}

Pilih referensi yang:
- Dari lembaga/institusi BERBEDA dari ${context.university_name}
- Relevan dengan topik jawaban
- Kredibel (jurnal ilmiah, buku referensi, regulasi pemerintah)
- Tulis judul dan sumber, tanpa simbol aneh`
  }
  return basePrompt
}

export function formatReference(
  type: 'module' | 'journal' | 'book' | 'government',
  data: Record<string, unknown>
): string {
  switch (type) {
    case 'module':
      return `${data.author}. (${data.year}). ${data.title}. ${data.publisher}.`
    case 'journal':
      const authors = (data.authors as string[])?.join(', ') || data.author || 'Unknown'
      return `${authors}. (${data.year}). ${data.title}. ${data.journal_name}, ${data.volume}(${data.issue}), ${data.pages}.`
    case 'book':
      return `${data.author}. (${data.year}). ${data.title}. ${data.publisher}.`
    case 'government':
      return `${data.title}. (${data.year}). ${data.institution}.`
    default:
      return ''
  }
}