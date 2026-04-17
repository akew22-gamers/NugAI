"use client"

import Link from "next/link"
import { FileText, CheckCircle2, ArrowRight } from "lucide-react"

interface TaskSession {
  id: string
  task_type: "DISCUSSION" | "ASSIGNMENT"
  min_words_target: number
  created_at: string
  course_name: string | null
  module_book_title: string | null
  tutor_name: string | null
  items_count: number
}

interface RecentTasksProps {
  tasks: TaskSession[]
  isLoading?: boolean
}

export function RecentTasks({ tasks, isLoading }: RecentTasksProps) {
  const getTaskTypeLabel = (type: "DISCUSSION" | "ASSIGNMENT") => {
    return type === "DISCUSSION" ? "Tugas Diskusi" : "Tugas Soal"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Tanggal tidak valid"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Tanggal tidak valid"
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900">Tugas Terakhir</h3>
          <p className="text-sm text-zinc-500">5 tugas terakhir yang dibuat</p>
        </div>
        <Link
          href="/task"
          className="flex items-center gap-1 text-sm font-medium text-zinc-900 hover:text-zinc-700"
        >
          Lihat semua
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && tasks.length === 0 ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-zinc-100"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-zinc-300" />
            <h4 className="mt-4 font-medium text-zinc-900">Belum ada tugas</h4>
            <p className="mt-1 text-sm text-zinc-500">
              Mulai buat tugas pertama Anda dengan AI
            </p>
            <Link
              href="/task/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <FileText className="h-4 w-4" />
              Buat Tugas Baru
            </Link>
          </div>
        ) : (
          tasks.map((task) => (
            <Link
              key={task.id}
              href={`/task/${task.id}`}
              className="group flex items-center justify-between rounded-lg border border-zinc-100 p-4 transition-colors hover:border-zinc-200 hover:bg-zinc-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-medium text-zinc-900 group-hover:text-zinc-700">
                    {task.course_name || "Tugas Tanpa Mata Kuliah"}
                  </h4>
                  <p className="text-sm text-zinc-500">
                    {getTaskTypeLabel(task.task_type)} • {task.items_count} soal
                  </p>
                </div>
              </div>
              <span className="text-xs text-zinc-400">{formatDate(task.created_at)}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}