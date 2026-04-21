"use client"

import { TaskWizard } from "@/components/task/TaskWizard"

export default function TugasDiskusiPage() {
  return (
    <TaskWizard
      defaultTaskType="DISCUSSION"
      title="Tugas Diskusi"
      subtitle="Generate jawaban tugas diskusi akademik dengan AI"
    />
  )
}
