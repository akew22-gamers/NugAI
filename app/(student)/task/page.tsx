"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { FileText, CheckCircle2, XCircle, Loader2, ArrowRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

export default function TaskHistoryPage() {
  const { status } = useSession()
  const [tasks, setTasks] = useState<TaskSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated") {
      fetchTasks()
    }
  }, [status])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks?limit=50")
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (!dateString || isNaN(date.getTime())) {
      return "Tanggal tidak valid"
    }
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTaskTypeLabel = (type: "DISCUSSION" | "ASSIGNMENT") => {
    return type === "DISCUSSION" ? "Tugas Diskusi" : "Tugas Soal"
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-900 mx-auto" />
          <p className="mt-2 text-sm text-zinc-500">Memuat tugas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Tugas</h1>
          <p className="text-slate-600 mt-1">
            Daftar tugas yang pernah dikerjakan
          </p>
        </div>
        <Link href="/task/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Tugas Baru
          </Button>
        </Link>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <FileText className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="font-semibold text-slate-900">Belum ada tugas</h3>
            <p className="text-slate-500 mt-2">
              Mulai buat tugas pertama Anda dengan AI
            </p>
            <Link href="/task/new" className="mt-4">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Buat Tugas Baru
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/task/${task.id}`}
              className="block"
            >
              <Card className="hover:border-zinc-300 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">
                          {task.course_name || "Tugas Tanpa Mata Kuliah"}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {getTaskTypeLabel(task.task_type)} • {task.items_count} soal • {task.min_words_target} kata
                        </p>
                        {task.module_book_title && (
                          <p className="text-xs text-slate-400 mt-1">
                            Modul: {task.module_book_title}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        {formatDate(task.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}