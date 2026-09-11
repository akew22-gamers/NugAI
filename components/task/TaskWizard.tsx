"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Step1Input } from "@/components/task/Step1Input"
import { Step2Processing } from "@/components/task/Step2Processing"
import { Step3Result } from "@/components/task/Step3Result"
import { TaskFormData, TaskResult } from "@/app/(student)/task/new/page"

export interface GenerationProgress {
  stage: string
  message: string
  providerName?: string
  model?: string
  items: Array<{ questionOrder: number; status: "GENERATING" | "COMPLETED" | "FAILED"; error?: string }>
}

interface TaskWizardProps {
  defaultTaskType: "DISCUSSION" | "ASSIGNMENT"
  title: string
  subtitle: string
}

export function TaskWizard({ defaultTaskType, title, subtitle }: TaskWizardProps) {
  const [step, setStep] = useState(1)
    const [formData, setFormData] = useState<TaskFormData>({
    task_type: defaultTaskType,
    task_description: "",
    course_id: null,
    course_name: "",
    module_book_title: "",
    tutor_name: "",
    answer_length: "MEDIUM",
    answer_style: "paragraph",
    source_requirements: "",
    questions: [],
  })
  const [result, setResult] = useState<TaskResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [regenerateCounts, setRegenerateCounts] = useState<{[key: number]: number}>({})
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [providerName, setProviderName] = useState<string>("")
  const [modelName, setModelName] = useState<string>("")
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({ stage: "preparing", message: "Menyiapkan tugas...", items: [] })

  const handleStep1Complete = (data: TaskFormData) => {
    setFormData(data)
    setGenerationProgress({
      stage: "preparing",
      message: `Menyiapkan jawaban untuk ${data.questions.length} soal...`,
      items: data.questions.map((_, index) => ({ questionOrder: index + 1, status: "GENERATING" })),
    })
    setStep(2)
    handleGenerate(data)
  }

  const handleGenerate = async (data: TaskFormData) => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/generate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let message = "Gagal generate jawaban"
        try {
          const errorData = await response.json()
          if (errorData?.error) message = errorData.error
        } catch {
          // Gunakan pesan default bila body bukan JSON
        }
        throw new Error(message)
      }
      if (!response.body) throw new Error("Gagal generate jawaban")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() || ""
        for (const event of events) {
          const line = event.split("\n").find((value) => value.startsWith("data: "))
          if (!line) continue
          const data = JSON.parse(line.slice(6))
          if (data.event === "progress") {
            setGenerationProgress({ stage: data.stage, message: data.message, providerName: data.providerName, model: data.model, items: data.items || [] })
          }
          if (data.event === "complete") {
            setResult(data.result)
            setProviderName(data.result.providerName || "")
            setModelName(data.result.model || "")
            setStep(3)
          }
          if (data.event === "error") throw new Error(data.message || "Gagal generate jawaban")
        }
      }
    } catch (error) {
      console.error("Generation failed:", error)
      toast.error(error instanceof Error ? error.message : "Gagal generate jawaban")
      setStep(1)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRegenerate = async (questionIndex: number, instructions?: string, answerLength?: string, answerStyle?: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: result?.sessionId,
          questionIndex,
          instructions,
          answer_length: answerLength,
          answer_style: answerStyle,
        }),
      })

      if (!response.ok) {
        let message = "Gagal regenerate jawaban"
        try {
          const errorData = await response.json()
          if (errorData?.error) message = errorData.error
        } catch {
          // Gunakan pesan default bila body bukan JSON
        }
        throw new Error(message)
      }

      const newData = await response.json()
      setResult((prev) =>
        prev
          ? {
            ...prev,
            answers: prev.answers.map((a, i) =>
              i === questionIndex ? newData.answer : a
            ),
          }
          : null
      )
      setRegenerateCounts(prev => ({
        ...prev,
        [questionIndex]: (prev[questionIndex] || 0) + 1
      }))
      if (newData.providerName) {
        setProviderName(newData.providerName)
      }
      if (newData.model) {
        setModelName(newData.model)
      }
      toast.success(`Jawaban soal ${questionIndex + 1} berhasil diperbarui`)
    } catch (error) {
      console.error("Regeneration failed:", error)
      toast.error(error instanceof Error ? error.message : "Gagal regenerate jawaban")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setFormData({
      task_type: defaultTaskType,
      task_description: "",
      course_id: null,
      course_name: "",
      module_book_title: "",
      tutor_name: "",
      answer_length: "MEDIUM",
      answer_style: "paragraph",
      source_requirements: "",
      questions: [],
    })
    setResult(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-zinc-900" : "text-zinc-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-zinc-900 text-white" : "bg-zinc-200"}`}>
            1
          </div>
          <span className="font-medium">Input</span>
        </div>
        <div className="h-px w-8 bg-zinc-200" />
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-zinc-900" : "text-zinc-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-zinc-900 text-white" : "bg-zinc-200"}`}>
            2
          </div>
          <span className="font-medium">Processing</span>
        </div>
        <div className="h-px w-8 bg-zinc-200" />
        <div className={`flex items-center gap-2 ${step >= 3 ? "text-zinc-900" : "text-zinc-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-zinc-900 text-white" : "bg-zinc-200"}`}>
            3
          </div>
          <span className="font-medium">Hasil</span>
        </div>
      </div>

      {step === 1 && (
        <Step1Input
          initialData={formData}
          onComplete={handleStep1Complete}
          lockedTaskType={defaultTaskType}
        />
      )}

      {step === 2 && (
        <Step2Processing
          formData={formData}
          progress={generationProgress}
        />
      )}

      {step === 3 && result && (
        <Step3Result
          formData={formData}
          result={result}
          onRegenerate={handleRegenerate}
          onReset={handleReset}
          isProcessing={isProcessing}
          providerName={providerName}
          modelName={modelName}
          regenerateCounts={regenerateCounts}
          activeQuestion={activeQuestion}
          setActiveQuestion={setActiveQuestion}
        />
      )}
    </div>
  )
}
