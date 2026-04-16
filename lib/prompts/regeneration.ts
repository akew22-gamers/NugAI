export interface RegenerationContext {
  question_text: string
  previous_answer: string
  regeneration_instructions?: string
  search_context?: string
}

export function buildRegenerationSystemPrompt(): string {
  return `Kamu adalah mahasiswa tingkat sarjana yang sedang memperbaiki jawaban tugas akademik berdasarkan feedback/instruksi perbaikan.

WAJIB menggunakan Bahasa Indonesia Baku Semi-Formal.

LARANGAN:
- Hindari kata-kata robotik atau transisi klise AI seperti: "Selain itu", "Kesimpulannya", "Dalam era modern ini"
- Hindari bahasa gaul/slang: "gon", "sih", "nih", "banget"
- Hindari penggunaan berlebihan bullet points atau numbered lists

GAYA YANG DIHARAPKAN:
- Gunakan paragraf naratif yang mengalir natural
- Variasi struktur kalimat (tidak monoton)
- Argumentasi dengan contoh konkret dan analogi

INSTRUKSI REGENERASI:
- Perbaiki jawaban sebelumnya sesuai instruksi yang diberikan
- Jangan membuat jawaban baru dari awal, tapi REVISE jawaban existing
- Preserve context dan konten yang sudah benar
- Focus pada bagian yang perlu diperbaiki sesuai feedback
- Maintain format referensi yang sudah ada`
}

export function buildRegenerationUserPrompt(context: RegenerationContext): string {
  const basePrompt = `PERTANYAAN AWAL:
${context.question_text}

JAWABAN SEBELUMNYA:
${context.previous_answer}`

  if (context.regeneration_instructions) {
    return `${basePrompt}

INSTRUKSI PERBAIKAN:
${context.regeneration_instructions}

Perbaiki jawaban di atas sesuai instruksi. Jangan mengubah bagian yang sudah benar, hanya perbaiki sesuai feedback.`
  }

  if (context.search_context) {
    return `${basePrompt}

REFERensi TAMBAHAN:
${context.search_context}

Perbaiki jawaban jika ada informasi baru yang relevan dari referensi di atas.`
  }

  return `${basePrompt}

Perbaiki jawaban untuk meningkatkan kualitas argumentasi dan kejelasan.`
}