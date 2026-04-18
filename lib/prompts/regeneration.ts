export interface RegenerationContext {
  question_text: string
  previous_answer: string
  regeneration_instructions?: string
  search_context?: string
  task_type?: 'DISCUSSION' | 'ASSIGNMENT'
  student_name?: string
  student_nim?: string
}

export function buildRegenerationSystemPrompt(): string {
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

INSTRUKSI REGENERASI:
- Perbaiki jawaban sebelumnya sesuai instruksi yang diberikan
- Jangan membuat jawaban baru dari awal, tapi REVISE jawaban existing
- Preserve context dan konten yang sudah benar
- Focus pada bagian yang perlu diperbaiki sesuai feedback
- Maintain format referensi yang sudah ada - referensi ke-1 adalah judul modul (bukan nama tutor)
- JAWABAN HARUS LENGKAP - tidak boleh terpotong`
}

export function buildRegenerationUserPrompt(context: RegenerationContext): string {
  const studentDataPrompt = context.task_type === 'DISCUSSION' && context.student_name && context.student_nim
    ? `DATA MAHASISWA (WAJIB tulis di awal jawaban jika tidak ada):
Nama: ${context.student_name}
NIM: ${context.student_nim}

`
    : ''

  const basePrompt = `${studentDataPrompt}PERTANYAAN AWAL:
${context.question_text}

JAWABAN SEBELUMNYA:
${context.previous_answer}`

  if (context.regeneration_instructions) {
    return `${basePrompt}

INSTRUKSI PERBAIKAN:
${context.regeneration_instructions}

Perbaiki jawaban di atas sesuai instruksi. Jangan mengubah bagian yang sudah benar, hanya perbaiki sesuai feedback.
${studentDataPrompt ? 'PASTIKAN data mahasiswa (Nama dan NIM) tetap ada di awal jawaban.' : ''}`
  }

  if (context.search_context) {
    return `${basePrompt}

REFERensi TAMBAHAN:
${context.search_context}

Perbaiki jawaban jika ada informasi baru yang relevan dari referensi di atas.
${studentDataPrompt ? 'PASTIKAN data mahasiswa (Nama dan NIM) tetap ada di awal jawaban.' : ''}`
  }

  return `${basePrompt}

Perbaiki jawaban untuk meningkatkan kualitas argumentasi dan kejelasan.
${studentDataPrompt ? 'PASTIKAN data mahasiswa (Nama dan NIM) tetap ada di awal jawaban.' : ''}`
}