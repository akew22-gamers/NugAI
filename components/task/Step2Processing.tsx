"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { TaskFormData } from "@/app/(student)/task/new/page"
import { GenerationProgress } from "./TaskWizard"
import { cn } from "@/lib/utils"

interface Step2ProcessingProps {
  formData: TaskFormData
  progress: GenerationProgress
}

const STAGE_LABELS: Record<string, string> = {
  preparing: "Persiapan",
  validating: "Validasi tugas",
  searching: "Mencari referensi",
  preparing_ai: "Menyiapkan AI",
  generating: "AI menjawab soal",
  validating_answers: "Memverifikasi jawaban",
  saving: "Menyimpan jawaban",
  formatting: "Menyusun dokumen",
  failed: "Gagal",
}

export function Step2Processing({ formData, progress }: Step2ProcessingProps) {
  const lengthLabel = { SHORT: "Singkat", MEDIUM: "Sedang", LONG: "Panjang" }
  const doneCount = progress.items.filter((item) => item.status === "COMPLETED").length
  const failedCount = progress.items.filter((item) => item.status === "FAILED").length
  const totalCount = formData.questions.length

  return (
    <Card className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <Loader2 className="w-12 h-12 animate-spin text-zinc-900" />
          <h2 className="text-xl font-semibold text-zinc-900">Memproses Jawaban</h2>
          <p className="text-zinc-500 text-center max-w-md">
            {progress.message}
          </p>
          <p className="text-xs text-zinc-400">
            Tahap: {STAGE_LABELS[progress.stage] || progress.stage} • {doneCount}/{totalCount} soal selesai
            {failedCount > 0 ? ` • ${failedCount} gagal` : ""}
          </p>

          <div className="w-full max-w-md space-y-2 mt-4">
            {progress.providerName && (
              <div className="flex items-center gap-2 rounded-lg bg-purple-50 border border-purple-100 px-3 py-2 text-sm text-purple-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                AI: {progress.providerName}{progress.model ? ` - ${progress.model}` : ""}
              </div>
            )}
            {formData.questions.map((_, index) => {
              const item = progress.items.find((value) => value.questionOrder === index + 1)
              const status = item?.status || "GENERATING"
              return (
                <div key={index} className="flex items-center gap-2 text-sm text-zinc-600">
                  {status === "COMPLETED" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : status === "FAILED" ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span className={cn(status === "FAILED" && "text-red-600")}>
                    Soal {index + 1}: {status === "COMPLETED" ? "selesai" : status === "FAILED" ? item?.error || "gagal" : "menunggu respons AI"}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-6 p-4 bg-zinc-50 rounded-lg w-full max-w-md">
            <p className="text-sm text-zinc-600">
              <strong>Mata Kuliah:</strong> {formData.course_name}
            </p>
            <p className="text-sm text-zinc-600">
              <strong>Panjang Jawaban:</strong> {lengthLabel[formData.answer_length]}
            </p>
            <p className="text-sm text-zinc-600">
              <strong>Jumlah Soal:</strong> {formData.questions.length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
