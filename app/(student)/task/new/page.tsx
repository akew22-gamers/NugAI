"use client"

import { TaskWizard } from "@/components/task/TaskWizard"

export interface TaskFormData {
  task_type: "DISCUSSION" | "ASSIGNMENT"
  task_description: string
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
  providerName?: string
}

export default function TaskWizardPage() {
  return (
    <TaskWizard
      defaultTaskType="DISCUSSION"
      title="Generator Tugas"
      subtitle="Generate jawaban tugas akademik dengan AI"
    />
  )
}
