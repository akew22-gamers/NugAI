"use client"

import { useState } from "react"
import { Step1Input } from "@/components/task/Step1Input"
import { Step2Processing } from "@/components/task/Step2Processing"
import { Step3Result } from "@/components/task/Step3Result"
import { Course } from "@/components/courses/CourseCard"

export interface TaskFormData {
  task_type: "DISCUSSION" | "ASSIGNMENT"
  course_id: string | null
  course_name: string
  module_book_title: string
  tutor_name: string
  min_words_target: number
  questions: string[]
}

export interface TaskResult {
  sessionId: string
  answers: string[]
  references: Array<{
    type: string
    title: string
    url?: string
    author?: string
  }>
}

export default function TaskWizardPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<TaskFormData>({
    task_type: "DISCUSSION",
    course_id: null,
    course_name: "",
    module_book_title: "",
    tutor_name: "",
    min_words_target: 300,
    questions: [],
  })
  const [result, setResult] = useState<TaskResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [regenerateCounts, setRegenerateCounts] = useState<{[key: number]: number}>({})
  const [activeQuestion, setActiveQuestion] = useState(0)

  const handleStep1Complete = (data: TaskFormData) => {
    setFormData(data)
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
        throw new Error("Gagal generate jawaban")
      }

      const resultData = await response.json()
      setResult(resultData)
      setStep(3)
    } catch (error) {
      console.error("Generation failed:", error)
      setStep(1)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRegenerate = async (questionIndex: number, instructions?: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: result?.sessionId,
          questionIndex,
          instructions,
        }),
      })

      if (!response.ok) {
        throw new Error("Gagal regenerate jawaban")
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
    } catch (error) {
      console.error("Regeneration failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setFormData({
      task_type: "DISCUSSION",
      course_id: null,
      course_name: "",
      module_book_title: "",
      tutor_name: "",
      min_words_target: 300,
      questions: [],
    })
    setResult(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Generator Tugas</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Generate jawaban tugas akademik dengan AI
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
        />
      )}

      {step === 2 && (
        <Step2Processing
          formData={formData}
          isProcessing={isProcessing}
        />
      )}

      {step === 3 && result && (
        <Step3Result
          formData={formData}
          result={result}
          onRegenerate={handleRegenerate}
          onReset={handleReset}
          isProcessing={isProcessing}
          regenerateCounts={regenerateCounts}
          activeQuestion={activeQuestion}
          setActiveQuestion={setActiveQuestion}
        />
      )}
    </div>
  )
}