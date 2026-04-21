"use client"

import { TaskWizard } from "@/components/task/TaskWizard"

export default function TugasSoalPage() {
  return (
    <TaskWizard
      defaultTaskType="ASSIGNMENT"
      title="Tugas Soal"
      subtitle="Generate jawaban tugas soal akademik dengan AI"
    />
  )
}
