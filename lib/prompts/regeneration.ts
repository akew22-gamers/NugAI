export interface RegenerationContext {
  question_text: string
  previous_answer: string
  regeneration_instructions?: string
  search_context?: string
  task_type?: 'DISCUSSION' | 'ASSIGNMENT'
  student_name?: string
  student_nim?: string
  min_words_target?: number
  course_name?: string
  module_book_title?: string
  tutor_name?: string
  university_name?: string
}

export function buildRegenerationSystemPrompt(context: RegenerationContext): string {
  const minWords = context.min_words_target || 200
  const maxWords = Math.ceil(minWords * 1.15)

  const discussionFormatNote = context.task_type === 'DISCUSSION'
    ? `\n\nFORMAT BAKU JAWABAN DISCUSSION — WAJIB PERTAHANKAN:
Header  : Nama  : [Nama] / NIM   : [NIM] (tidak dihitung word count)
Isi     : Salam pembuka (1 kalimat) + Body (min 3 paragraf naratif) + Penutup (1 kalimat)
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

ATURAN KATA KRITIS:
- Target kata BODY (isi jawaban): ${minWords} kata
- Maksimal kata BODY: ${maxWords} kata (${minWords} + 15% toleransi)
- BODY = paragraf argumentasi utama (SALAM PEMBUKA + ISI + PENUTUP)
- TIDAK TERMASUK: Header "Nama/NIM" dan bagian "Referensi"
- JAWABAN HARUS LENGKAP DAN UTUH - tidak boleh terpotong di tengah kalimat
- Jika mendekati batas maksimal ${maxWords} kata, TETAP selesaikan kalimat dan paragraf terakhir dengan sempurna
- Prioritaskan KELENGKAPAN jawaban - lebih baik sedikit di bawah target daripada terpotong
- TIDAK BOLEH kurang dari ${minWords} kata untuk BODY
- TIDAK BOLEH lebih dari ${maxWords} kata untuk BODY (15% toleransi maksimal)
- HITUNG kata dengan teliti sebelum menyelesaikan jawaban

ATURAN REFERENSI:
- Referensi ke-1: tulis judul modul${context.module_book_title ? ` "${context.module_book_title}"` : ''} dari ${context.university_name || 'universitas terkait'}
- JANGAN PERNAH menulis nama Dosen/Tutor${context.tutor_name ? ` (${context.tutor_name})` : ''} sebagai pengarang referensi ke-1
- Pengarang modul BUKAN dosen/tutor yang mengajar - JANGAN tulis nama tutor sebagai pengarang
- Referensi ke-2 WAJIB dari BUKU AKADEMIK terbitan penerbit resmi (Erlangga, Gramedia, Salemba Empat, Rajawali Pers, Prenada Media, McGraw-Hill, Pearson, dll)
- DILARANG KERAS menggunakan sumber dari: scribd.com, academia.edu, slideshare.net, blogspot, wordpress, atau website tidak kredibel
- DILARANG menggunakan website/artikel online sebagai referensi ke-2
- HARUS berupa buku teks akademik yang benar-benar ada dan diterbitkan
- Format Referensi: tulis "Referensi:" di baris tersendiri, lalu baris kosong, lalu nomor 1 dan 2${discussionFormatNote}

INSTRUKSI REGENERASI:
- Perbaiki jawaban sebelumnya sesuai instruksi yang diberikan
- Jangan membuat jawaban baru dari awal, tapi REVISE jawaban existing
- Preserve context dan konten yang sudah benar
- Focus pada bagian yang perlu diperbaiki sesuai feedback
- PASTIKAN jumlah kata BODY tetap dalam range ${minWords}-${maxWords} kata
- JAWABAN HARUS LENGKAP - tidak boleh terpotong`
}

export function buildRegenerationUserPrompt(context: RegenerationContext): string {
  const minWords = context.min_words_target || 200
  const maxWords = Math.ceil(minWords * 1.15)

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

ATURAN KATA: BODY jawaban harus ${minWords}-${maxWords} kata (15% toleransi). JAWABAN HARUS LENGKAP DAN UTUH - tidak boleh terpotong.
ATURAN REFERENSI: Referensi ke-1 BUKAN ditulis oleh tutor/dosen${context.tutor_name ? ` (${context.tutor_name})` : ''}, tapi tulis judul modul dan sumber universitas. Referensi ke-2 HARUS dari buku akademik terbitan penerbit resmi, BUKAN dari scribd.com atau website tidak kredibel.`

  if (context.regeneration_instructions) {
    return `${basePrompt}

INSTRUKSI PERBAIKAN:
${context.regeneration_instructions}

Perbaiki jawaban di atas sesuai instruksi. Jangan mengubah bagian yang sudah benar, hanya perbaiki sesuai feedback.
${studentDataPrompt ? 'PASTIKAN data mahasiswa (Nama dan NIM) tetap ada di awal jawaban.' : ''}
PASTIKAN jumlah kata BODY tetap dalam range ${minWords}-${maxWords} kata dan jawaban TIDAK TERPOTONG.`
  }

  if (context.search_context) {
    return `${basePrompt}

REFERensi TAMBAHAN:
${context.search_context}

Perbaiki jawaban jika ada informasi baru yang relevan dari referensi di atas.
${studentDataPrompt ? 'PASTIKAN data mahasiswa (Nama dan NIM) tetap ada di awal jawaban.' : ''}
PASTIKAN jumlah kata BODY tetap dalam range ${minWords}-${maxWords} kata dan jawaban TIDAK TERPOTONG.`
  }

  return `${basePrompt}

Perbaiki jawaban untuk meningkatkan kualitas argumentasi dan kejelasan.
${studentDataPrompt ? 'PASTIKAN data mahasiswa (Nama dan NIM) tetap ada di awal jawaban.' : ''}
PASTIKAN jumlah kata BODY tetap dalam range ${minWords}-${maxWords} kata dan jawaban TIDAK TERPOTONG.`
}