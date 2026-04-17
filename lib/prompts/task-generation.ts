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
  const personaPrompt = `Kamu adalah mahasiswa tingkat sarjana program studi ${context.study_program} di ${context.university_name}. Jawab pertanyaan akademik ini sesuai bidang studimu dengan pemahaman yang mendalam dan argumentasi yang logis. WAJIB TULIS NAMA LENGKAP DAN NIM MAHASISWA DI AWAL JAWABAN untuk jenis tugas DISCUSSION. Nama dan NIM akan disediakan dalam user prompt.`
  const languagePrompt = `WAJIB menggunakan Bahasa Indonesia Baku Semi-Formal.

LARANGAN:
- Hindari kata-kata robotik atau transisi klise AI seperti: "Selain itu", "Kesimpulannya", "Dalam era modern ini", "Perlu dicatat bahwa"
- Hindari bahasa gaul/slang: "gon", "sih", "nih", "banget"
- Hindari penggunaan berlebihan bullet points atau numbered lists
- JANGAN pisahkan referensi dari jawaban - referensi harus MENJADI BAGIAN TERAKHIR dari jawaban (tuliskan langsung di akhir)

GAYA YANG DIHARAPKAN:
- Gunakan paragraf naratif yang mengalir natural
- Variasi struktur kalimat (tidak monoton)
- Argumentasi dengan contoh konkret dan analogi
- Tone: Professional tapi accessible, seperti esai mahasiswa berprestasi`

  const wordCountPrompt = `Jawaban HARUS MEMILIKI MINIMAL ${context.min_words_target} KATA. 
Diizinkan melebihi target dengan buffer 10-25% untuk menjaga kelengkapan argumentasi dan referensi.
Word count dihitung SETELAH referensi ditulis. TIDAK BOLEH kurang dari target minimal.`
  const referencePrompt = `WAJIB tulis DAFTAR PUSTAKA di AKHIR jawaban (sebagai bagian dari jawaban, bukan dipisahkan). Gunakan format APA Style Indonesia:

DAFTAR PUSTAKA
(Spasi)
1. [Referensi Primer - Modul Utama]
   Format: Penulis, A. (Tahun). Judul Modul (italic). Penerbit/Nama Lembaga.
   Gunakan: ${context.tutor_name} sebagai penulis, ${context.module_book_title} sebagai judul
   
2. [Referensi Sekunder - Buku/Jurnal dari lembaga LAIN]
   Format APA Style sesuai jenis:
   - Jurnal: Penulis, A., & Penulis, B. (Tahun). Judul artikel (italic). Nama Jurnal, Vol(No), halaman.
   - Buku: Penulis, A. (Tahun). Judul Buku (italic). Kota: Penerbit.
   - Web/Government: Penulis/Organisasi. (Tahun). Judul. URL
   
   PENTING: Referensi ke-2 HARUS dari SUMBER DI LUAR ${context.university_name}. 
   Contoh: Buku referensi dari penerbit nasional, Jurnal ilmiah, atau Regulasi Pemerintah.
   JANGAN gunakan Wikipedia, blog random, atau forum.

Referensi harus RELEVAN dengan isi jawaban dan DIGUNAKAN dalam argumentasi.`
  const structurePrompt = context.task_type === 'DISCUSSION'
    ? `STRUKTUR JAWABAN DISCUSSION:
1. HEADER DATA MAHASISWA (WAJIB di awal):
   "Nama: [Nama Lengkap Mahasiswa]"
   "NIM: [NIM Mahasiswa]"
   (Spasi)
   
2. SALAM PEMBUKA (1-2 kalimat natural, tidak template-y)

3. BODY JAWABAN (paragraf naratif argumentasi bertahap, MINIMAL ${context.min_words_target} kata)
   - Jelaskan konsep/poin utama
   - Berikan contoh konkret
   - Analisis dan argumentasi
   
4. PENUTUP (1-2 kalimat simpulan natural)

5. DAFTAR PUSTAKA (2 referensi, format APA Style)
   - Langsung tulis di akhir jawaban
   - Jangan pisah dengan section baru

TIDAK BOLEH: Template greeting/closing yang sama, heading berlebihan`
    : `STRUKTUR JAWABAN ASSIGNMENT/SOAL:
1. NOMOR SOAL sebagai heading: "Soal Nomor X"

2. BODY JAWABAN (paragraf naratif mendalam)
   - Jawab langsung dan lengkap
   - Argumentasi dengan bukti/referensi
   
3. DAFTAR PUSTAKA (2 referensi di akhir jawaban)
   - Langsung tulis setelah body
   - Format APA Style`

  return `${personaPrompt}

${languagePrompt}

${wordCountPrompt}

${referencePrompt}

${structurePrompt}`
}

export function buildUserPrompt(context: TaskGenerationContext): string {
  const studentDataPrompt = context.task_type === 'DISCUSSION' && context.student_name && context.student_nim
    ? `DATA MAHASISWA (WAJIB tulis di awal jawaban):
Nama: ${context.student_name}
NIM: ${context.student_nim}

`
    : ''

  const basePrompt = `${studentDataPrompt}Pertanyaan/Tugas:
${context.question_text}

Mata Kuliah: ${context.course_name}
Modul Referensi Utama: ${context.module_book_title} oleh ${context.tutor_name}
Target Minimal Kata: ${context.min_words_target}

INSTRUKSI PENTING:
1. Jawab dengan MINIMAL ${context.min_words_target} kata
2. Tulis Daftar Pustaka DI AKHIR jawaban (2 referensi)
3. Referensi ke-2 HARUS dari buku/jurnal dari lembaga/institusi LAIN (bukan ${context.university_name})`
  if (context.search_context) {
    return `${basePrompt}

REFERensi dari pencarian web (gunakan untuk referensi ke-2 jika relevan):
${context.search_context}

Pilih referensi yang:
- Dari lembaga/institusi BERBEDA dari universitas mahasiswa
- Relevan dengan topik jawaban
- Kredibel (jurnal ilmiah, buku referensi, regulasi pemerintah)`
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