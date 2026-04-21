"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { TaskFormData } from "@/app/(student)/task/new/page"
import { TaskResult } from "@/app/(student)/task/new/page"
import { Download, RefreshCw, ArrowLeft, Loader2, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface Step3ResultProps {
  formData: TaskFormData
  result: TaskResult
  onRegenerate: (questionIndex: number, instructions?: string) => void
  onReset: () => void
  isProcessing: boolean
  providerName?: string
  regenerateCounts?: {[key: number]: number}
  activeQuestion?: number
  setActiveQuestion?: (index: number) => void
}

export function Step3Result({
  formData,
  result,
  onRegenerate,
  onReset,
  isProcessing,
  providerName = "DeepSeek",
  regenerateCounts = {},
  activeQuestion,
  setActiveQuestion,
}: Step3ResultProps) {
  const [internalActiveQuestion, setInternalActiveQuestion] = useState(0)
  const [regenerateInstructions, setRegenerateInstructions] = useState("")
  const [showRegenerateInput, setShowRegenerateInput] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const questionIndex = setActiveQuestion !== undefined ? activeQuestion ?? 0 : internalActiveQuestion
  const setQuestionIndex = setActiveQuestion || setInternalActiveQuestion

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length
  }

  const handleCopyAnswer = async (index: number) => {
    const answer = result.answers[index]
    const label = formData.task_type === "ASSIGNMENT" && formData.questions.length > 1
      ? `Jawaban Soal ${index + 1}:\n\n`
      : ""
    try {
      await navigator.clipboard.writeText(label + answer)
      setCopiedIndex(index)
      toast.success("Jawaban berhasil di-copy")
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      toast.error("Gagal copy jawaban")
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: result.sessionId,
          taskType: formData.task_type,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement("a")
      a.href = url
      a.download = `Tugas-${formData.course_name.replace(/\s+/g, '-')}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success("PDF berhasil di-download")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal generate PDF")
    }
  }

  const handleRegenerate = () => {
    onRegenerate(questionIndex, regenerateInstructions || undefined)
    setRegenerateInstructions("")
    setShowRegenerateInput(false)
  }

  const currentAnswer = result.answers[questionIndex] || ""
  const wordCount = countWords(currentAnswer)
  const meetsTarget = wordCount >= formData.min_words_target
  const regenCount = regenerateCounts[questionIndex] || 0

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Buat Tugas Baru
        </Button>
        <Button onClick={handleDownloadPDF} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      {formData.task_type === "ASSIGNMENT" && formData.questions.length > 1 && (
        <Card className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              {formData.questions.map((_, index) => (
                <Button
                  key={index}
                  variant={questionIndex === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuestionIndex(index)}
                >
                  Soal {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span>
                Jawaban {formData.task_type === "ASSIGNMENT" ? `Soal ${questionIndex + 1}` : "Diskusi"}
              </span>
              {providerName && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700">
                  {providerName}
                </span>
              )}
              {regenCount > 0 && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
                  Regenerate: {regenCount}x
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />}
              <span className={`text-sm ${meetsTarget ? "text-emerald-600" : "text-amber-600"}`}>
                {wordCount} kata {meetsTarget ? "✓" : `(min: ${formData.min_words_target})`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyAnswer(questionIndex)}
                disabled={isProcessing}
                className="gap-1 h-7 px-2 text-xs"
              >
                {copiedIndex === questionIndex ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedIndex === questionIndex ? "Copied" : "Copy"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            className="prose prose-sm max-w-none max-h-[400px] overflow-y-auto pr-2"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4d4d8 #f4f4f5' }}
          >
            {formData.task_type === "ASSIGNMENT" && formData.questions.length > 1 && (
              <p className="font-semibold text-indigo-700 text-base mb-2">
                Jawaban Soal {questionIndex + 1}
              </p>
            )}
            <p className="whitespace-pre-wrap text-zinc-700 leading-relaxed">
              {currentAnswer}
            </p>
          </div>

          {showRegenerateInput && (
            <div className="space-y-2 pt-4 border-t border-zinc-200">
              <Textarea
                value={regenerateInstructions}
                onChange={(e) => setRegenerateInstructions(e.target.value)}
                placeholder="Instruksi perbaikan (opsional), contoh: 'tambahkan contoh konkret', 'perbaiki referensi'"
                rows={2}
              />
              <div className="flex gap-2">
                <Button onClick={handleRegenerate} disabled={isProcessing} className="gap-2">
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRegenerateInput(false)}
                >
                  Batal
                </Button>
              </div>
            </div>
          )}

          {!showRegenerateInput && (
            <Button
              variant="outline"
              onClick={() => setShowRegenerateInput(true)}
              disabled={isProcessing}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate Jawaban
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}