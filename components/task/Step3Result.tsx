"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { TaskFormData } from "@/app/(student)/task/new/page"
import { TaskResult } from "@/app/(student)/task/new/page"
import { Download, RefreshCw, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Step3ResultProps {
  formData: TaskFormData
  result: TaskResult
  onRegenerate: (questionIndex: number, instructions?: string) => void
  onReset: () => void
  isProcessing: boolean
}

export function Step3Result({
  formData,
  result,
  onRegenerate,
  onReset,
  isProcessing,
}: Step3ResultProps) {
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [regenerateInstructions, setRegenerateInstructions] = useState("")
  const [showRegenerateInput, setShowRegenerateInput] = useState(false)

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
        throw new Error("Gagal generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement("a")
      a.href = url
      a.download = `Tugas-${formData.course_name}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success("PDF berhasil di-download")
    } catch (error) {
      toast.error("Gagal generate PDF")
    }
  }

  const handleRegenerate = () => {
    onRegenerate(activeQuestion, regenerateInstructions || undefined)
    setRegenerateInstructions("")
    setShowRegenerateInput(false)
  }

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Buat Tugas Baru
        </Button>
        <Button onClick={handleDownloadPDF} className="gap-2">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      {formData.task_type === "ASSIGNMENT" && formData.questions.length > 1 && (
        <Card className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-2">
              {formData.questions.map((_, index) => (
                <Button
                  key={index}
                  variant={activeQuestion === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveQuestion(index)}
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
          <CardTitle className="flex items-center justify-between">
            <span>Jawaban {formData.task_type === "ASSIGNMENT" ? `Soal ${activeQuestion + 1}` : ""}</span>
            <span className="text-sm text-zinc-500">
              {countWords(result.answers[activeQuestion] || "")} kata
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-zinc-700 leading-relaxed">
              {result.answers[activeQuestion]}
            </p>
          </div>

          {showRegenerateInput && (
            <div className="space-y-2 pt-4 border-t border-zinc-200">
              <Textarea
                value={regenerateInstructions}
                onChange={(e) => setRegenerateInstructions(e.target.value)}
                placeholder="Instruksi perbaikan (opsional)"
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
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate Jawaban
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Referensi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {result.references.map((ref, index) => (
            <div key={index} className="text-sm text-zinc-600">
              <p className="font-medium">{index + 1}. {ref.title}</p>
              {ref.author && <p>Penulis: {ref.author}</p>}
              {ref.url && (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {ref.url}
                </a>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}