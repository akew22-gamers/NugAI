"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { TaskFormData } from "@/app/(student)/task/new/page"

interface Step2ProcessingProps {
  formData: TaskFormData
  isProcessing: boolean
}

export function Step2Processing({ formData, isProcessing }: Step2ProcessingProps) {
  return (
    <Card className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <Loader2 className="w-12 h-12 animate-spin text-zinc-900" />
          <h2 className="text-xl font-semibold text-zinc-900">Memproses Jawaban</h2>
          <p className="text-zinc-500 text-center max-w-md">
            AI sedang mencari referensi dan generate jawaban untuk {formData.questions.length} soal.
            Proses ini mungkin memakan waktu beberapa menit.
          </p>

          <div className="w-full max-w-md space-y-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Mencari referensi dari jurnal dan modul...
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generate jawaban dengan AI...
            </div>
          </div>

          <div className="mt-6 p-4 bg-zinc-50 rounded-lg w-full max-w-md">
            <p className="text-sm text-zinc-600">
              <strong>Mata Kuliah:</strong> {formData.course_name}
            </p>
            <p className="text-sm text-zinc-600">
              <strong>Target Kata:</strong> {formData.min_words_target} kata
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