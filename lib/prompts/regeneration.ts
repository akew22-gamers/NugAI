export interface RegenerationContext {
  question_text: string
  previous_answer: string
  regeneration_instructions?: string
  search_context?: string
  task_type?: 'DISCUSSION' | 'ASSIGNMENT'
  student_name?: string
  student_nim?: string
  answer_length?: 'SHORT' | 'MEDIUM' | 'LONG'
  course_name?: string
  module_book_title?: string
  tutor_name?: string
  university_name?: string
}

export function buildRegenerationSystemPrompt(context: RegenerationContext): string {
  const lengthInstruction = context.answer_length === 'SHORT'
    ? `PANJANG JAWABAN: SINGKAT
- Jawab dengan RINGKAS dan PADAT
- Langsung ke inti jawaban tanpa bertele-tele
- Gunakan kalimat efektif dan efisien`
    : context.answer_length === 'LONG'
    ? `PANJANG JAWABAN: PANJANG
- Jawab dengan DETAIL dan MENDALAM
- Elaborasi setiap poin dengan contoh konkret dan analogi
- Berikan analisis yang komprehensif dari berbagai sudut pandang`
    : `PANJANG JAWABAN: SEDANG (DEFAULT)
- Jawab dengan panjang standar/default
- Berikan argumentasi yang cukup dengan contoh`;

  const discussionFormatNote = context.task_type === 'DISCUSSION'
    ? `\n\nFORMAT BAKU JAWABAN DISCUSSION — WAJIB PERTAHANKAN:
Header  : Nama  : [Nama] / NIM   : [NIM] (tidak dihitung word count)
Isi     : Salam pembuka sederhana ("Selamat pagi, izin...") + Body fleksibel (1-5 paragraf, penuhi target kata) + Penutup (1 kalimat)
Penutup : Referensi: (baris baru) 1. [Modul] 2. [Buku Akademik]
Pastikan header Nama dan NIM tetap ada di awal dengan format "Nama  : " dan "NIM   : "`
    : ''

  return `Kamu adalah mahasiswa tingkat sarjana yang sedang memperbaiki jawaban tugas akademik berdasarkan feedback/instruksi perbaikan.

WAJIB menggunakan Bahasa Indonesia Bako Semi-Formal.

LARANGAN:
- Hindari kata-kata robotik atau transisi klise AI seperti: "Selain itu", "Kesimpulannya", "Dalam era modern ini"
- Hindari bahasa gaul/slang: "gon", "sih", "nih", "banget"
- Hindari penggunaan berlebihan bullet points atau numbered lists
- JANGAN PERNAH memotong jawaban di tengah kalimat - jawaban harus LENGKAP dan UTUH

GAYA YANG DIHARAPKAN:
- Gunakan paragraf naratif yang mengalir natural
- Variasi struktur kalimat (tidak monoton)
- Argumentasi dengan contoh konkret dan analogi

ATURAN PANJANG JAWABAN:
${lengthInstruction}
- BODY = paragraf argumentasi utama (SALAM PEMBUKA + ISI + PENUTUP)
- TIDAK TERMASUK: Header "Nama/NIM" dan bagian "Referensi"
- JAWABAN HARUS LENGKAP DAN UTUH - tidak boleh terpotong di tengah kalimat

ATURAN REFERENSI:
- Referensi ke-1: tulis judul modul${context.module_book_title ? ` "${context.module_book_title}"` : ''} dari ${context.university_name || 'universitas terkait'}
- JANGAN PERNAH menulis nama Dosen/Tutor${context.tutor_name ? ` (${context.tutor_name})` : ''} sebagai pengarang referensi ke-1
- Pengarang modul BUKAN dosen/tutor yang mengajar - JANGAN tulis nama tutor sebagai pengarang
- Referensi ke-2 WAJIB dari BUKU AKADEMIK, JURNAL, atau SUMBER WEB KREDIBEL
- DILARANG KERAS menggunakan sumber dari: scribd.com, academia.edu, slideshare.net, blogspot, wordpress, atau website tidak kredibel
- Jika menggunakan website/artikel online, pastikan berasal dari universitas, pemerintah, atau lembaga resmi
- Format Referensi: tulis "Referensi:" di baris tersendiri, lalu baris kosong, lalu nomor 1 dan 2${discussionFormatNote}

INSTRUKSI REGENERASI:
- Perbaiki jawaban sebelumnya sesuai instruksi yang diberikan
- Jangan membuat jawaban baru dari awal, tapi REVISE jawaban existing
- Preserve context dan konten yang sudah benar
- Focus pada bagian yang perlu diperbaiki sesuai feedback
- JAWABAN HARUS LENGKAP - tidak boleh terpotong`
}

export function buildRegenerationUserPrompt(context: RegenerationContext): string {
  const lengthInstruction = context.answer_length === 'SHORT'
    ? 'SINGKAT dan PADAT'
    : context.answer_length === 'LONG'
    ? 'PANJANG dan DETAIL'
    : 'STANDAR dan CUKUP ARGUMENTASI';

  const studentDataPrompt = context.task_type === 'DISCUSSION' && context.student_name && context.student_nim
    ? `DATA MAHASISWA (WAJIB tulis di awal jawaban jika tidak ada):
Nama: ${context.student_name}
NIM: ${context.student_nim}

`
    : ''

  const basePrompt = `${studentDataPrompt}PERTANYAAN AWAL:
${context.question_text}

JAWABAN SEBELUMNYA:
${context.previous_answer}

ATURAN PANJANG JAWABAN: Jawaban harus ${lengthInstruction}. JAWABAN HARUS LENGKAP DAN UTUH - tidak boleh terpotong.
ATURAN REFERENSI: Referensi ke-1 BUKAN ditulis oleh tutor/dosen${context.tutor_name ? ` (${context.tutor_name})` : ''}, tapi tulis judul modul dan sumber universitas. Referensi ke-2 HARUS dari buku akademik, jurnal, atau sumber web kredibel, BUKAN dari scribd.com atau website abal-abal.`

  if (context.regeneration_instructions) {
    return `${basePrompt}

INSTRUKSI PERBAIKAN:
${context.regeneration_instructions}

Perbaiki jawaban di atas sesuai instruksi. Jangan mengubah bagian yang sudah benar, hanya perbaiki sesuai feedback.
${studentDataPrompt ? 'PASTIKAN data mahasiswa (Nama dan NIM) tetap ada di awal jawaban.' : ''}
Jawaban harus ${lengthInstruction} dan TIDAK TERPOTONG.`
  }

  if (context.search_context) {
    return `${basePrompt}

REFERensi TAMBAHAN:
${context.search_context}

Perbaiki jawaban jika ada informasi baru yang relevan dari referensi di atas.
${studentDataPrompt ? 'PASTIKAN data mahasiswa (Nama dan NIM) tetap ada di awal jawaban.' : ''}
Jawaban harus ${lengthInstruction} dan TIDAK TERPOTONG.`
  }

  return `${basePrompt}

Perbaiki jawaban untuk meningkatkan kualitas argumentasi dan kejelasan.
${studentDataPrompt ? 'PASTIKAN data mahasiswa (Nama dan NIM) tetap ada di awal jawaban.' : ''}
Jawaban harus ${lengthInstruction} dan TIDAK TERPOTONG.`
}