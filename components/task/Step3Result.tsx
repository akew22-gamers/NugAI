"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { TaskFormData } from "@/app/(student)/task/new/page"
import { TaskResult } from "@/app/(student)/task/new/page"
import { Download, RefreshCw, ArrowLeft, Loader2, Copy, Check, FileText } from "lucide-react"
import { toast } from "sonner"
import { Loading } from "@/components/ui/loading"
import { PDFDownloadModal } from "./PDFDownloadModal"

import { cn } from "@/lib/utils"

interface Step3ResultProps {
  formData: TaskFormData
  result: TaskResult
  onRegenerate: (questionIndex: number, instructions?: string, answerLength?: string, answerStyle?: string) => void
  onReset: () => void
  isProcessing: boolean
  providerName?: string
  modelName?: string
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
  modelName,
  regenerateCounts = {},
  activeQuestion,
  setActiveQuestion,
}: Step3ResultProps) {
  const [internalActiveQuestion, setInternalActiveQuestion] = useState(0)
  const [regenerateInstructions, setRegenerateInstructions] = useState("")
  const [showRegenerateInput, setShowRegenerateInput] = useState(false)
  const [regenAnswerLength, setRegenAnswerLength] = useState<"SHORT" | "MEDIUM" | "LONG">(formData.answer_length || "MEDIUM")
  const [regenAnswerStyle, setRegenAnswerStyle] = useState<"paragraph" | "bullet" | "math_steps" | "combination">(formData.answer_style || "paragraph")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [isUT, setIsUT] = useState(false)
  const [includeDescription, setIncludeDescription] = useState(true)

  const questionIndex = setActiveQuestion !== undefined ? activeQuestion ?? 0 : internalActiveQuestion
  const setQuestionIndex = setActiveQuestion || setInternalActiveQuestion

  useEffect(() => {
    const checkUT = async () => {
      try {
        const res = await fetch("/api/profile")
        if (res.ok) {
          const data = await res.json()
          if (data.data?.university_name?.toLowerCase().includes("universitas terbuka")) {
            setIsUT(true)
          }
        }
      } catch {
        // ignore
      }
    }
    checkUT()
  }, [])

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length
  }

  const handleCopyAnswer = async (index: number) => {
    const answer = result.answers[index]
    const label = formData.task_type === "ASSIGNMENT" && formData.questions.length > 1
      ? `${index + 1}.\n\n`
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

  const handleDownloadPDF = async (options?: { withCover: boolean; sessionNumber?: number; fontFamily?: string }) => {
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: result.sessionId,
          taskType: formData.task_type,
          taskDescription: formData.task_description || "",
          withCover: options?.withCover || false,
          sessionNumber: options?.sessionNumber || undefined,
          includeDescription: includeDescription,
          fontFamily: options?.fontFamily || "Times-Roman",
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
    onRegenerate(questionIndex, regenerateInstructions || undefined, regenAnswerLength, regenAnswerStyle)
    setRegenerateInstructions("")
    setShowRegenerateInput(false)
  }

  const currentAnswer = result.answers[questionIndex] || ""
  const wordCount = countWords(currentAnswer)
  const regenCount = regenerateCounts[questionIndex] || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Buat Tugas Baru
        </Button>
        <Button onClick={() => setShowPDFModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
        {formData.task_description && formData.task_type === "ASSIGNMENT" && (
          <button
            type="button"
            onClick={() => setIncludeDescription(!includeDescription)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors text-sm"
            title={includeDescription ? "Deskripsi akan disertakan di PDF" : "Deskripsi hanya sebagai referensi AI, tidak masuk PDF"}
          >
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-600">Deskripsi di PDF</span>
            <div className={`relative w-8 h-4.5 rounded-full transition-colors ${includeDescription ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
              <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${includeDescription ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </button>
        )}
      </div>

      {formData.task_type === "ASSIGNMENT" && formData.questions.length > 1 && (
        <div className="flex gap-2 flex-wrap items-center rounded-xl border border-zinc-200 bg-white shadow-sm p-3">
          {formData.questions.map((_, index) => (
            <Button
              key={index}
              variant={questionIndex === index ? "default" : "outline"}
              size="sm"
              onClick={() => setQuestionIndex(index)}
              className={questionIndex === index ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""}
            >
              Soal {index + 1}
            </Button>
          ))}
        </div>
      )}

      <Card className="rounded-xl border border-zinc-200 bg-white shadow-sm relative overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm">
            <Loading text="Sedang regenerate jawaban..." className="h-full" />
          </div>
        )}
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>
                {formData.task_type === "ASSIGNMENT" && formData.questions.length > 1
                  ? `Jawaban Soal ${questionIndex + 1}`
                  : formData.task_type === "ASSIGNMENT" ? "Jawaban Soal" : "Jawaban Diskusi"}
              </span>
              {providerName && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700">
                  {providerName}
                </span>
              )}
              {modelName && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700">
                  {modelName}
                </span>
              )}
              {regenCount > 0 && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
                  Regenerate: {regenCount}x
                </span>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyAnswer(questionIndex)}
              disabled={isProcessing}
              className="gap-1.5 h-8 px-3 text-xs shrink-0 ml-4"
            >
              {copiedIndex === questionIndex ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedIndex === questionIndex ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />}
            <span className="text-sm text-slate-600">
              {wordCount} kata
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            className="prose prose-sm max-w-none max-h-[400px] overflow-y-auto pr-2"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4d4d8 #f4f4f5' }}
          >
            {formData.task_type === "ASSIGNMENT" && formData.questions.length > 1 && (
              <div className="mb-4">
                <p className="text-slate-500 text-sm font-medium">Pertanyaan:</p>
                <p className="text-slate-600 text-sm mt-0.5 whitespace-pre-wrap">{formData.questions[questionIndex]}</p>
                <p className="text-slate-500 text-sm mt-3 font-medium">Jawaban:</p>
              </div>
            )}
            <p className="whitespace-pre-wrap text-zinc-700 leading-relaxed">
              {currentAnswer.replace(/^\d+\.\s*/, '')}
            </p>
          </div>

          {showRegenerateInput && (
            <div className="space-y-4 pt-4 border-t border-zinc-200">
              <div>
                <p className="text-sm font-medium text-zinc-700 mb-2">Panjang Jawaban</p>
                <div className="flex gap-2">
                  {([
                    { value: "SHORT", label: "Singkat" },
                    { value: "MEDIUM", label: "Sedang" },
                    { value: "LONG", label: "Panjang" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRegenAnswerLength(opt.value)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                        regenAnswerLength === opt.value
                          ? "border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-700 mb-2">Gaya Jawaban</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "paragraph", label: "Paragraf" },
                    { value: "bullet", label: "Poin/Numbering" },
                    { value: "math_steps", label: "Langkah Matematika" },
                    { value: "combination", label: "Kombinasi" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRegenAnswerStyle(opt.value)}
                      className={cn(
                        "py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                        regenAnswerStyle === opt.value
                          ? "border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

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

      <PDFDownloadModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        onDownload={handleDownloadPDF}
        isUT={isUT}
        courseName={formData.course_name}
      />
    </div>
  )
}