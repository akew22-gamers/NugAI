"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { FileText, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

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
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const openDeleteDialog = (taskId: string) => {
    setDeleteTaskId(taskId)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTaskId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/tasks/${deleteTaskId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setTasks(tasks.filter((t) => t.id !== deleteTaskId))
        toast.success("Tugas berhasil dihapus")
      } else {
        toast.error("Gagal menghapus tugas")
      }
    } catch (error) {
      console.error("Failed to delete task:", error)
      toast.error("Gagal menghapus tugas")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setDeleteTaskId(null)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Tanggal tidak valid"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Tanggal tidak valid"
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

  const getTaskToDelete = () => tasks.find((t) => t.id === deleteTaskId)

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
            <Card key={task.id} className="hover:border-zinc-300 transition-colors">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-4 py-3">
                  <Link
                    href={`/task/${task.id}`}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex flex-col justify-center min-h-0">
                      <h3 className="font-medium text-slate-900 hover:text-indigo-600 leading-tight">
                        {task.course_name || "Tugas Tanpa Mata Kuliah"}
                      </h3>
                      <p className="text-sm text-slate-500 leading-tight mt-0.5">
                        {getTaskTypeLabel(task.task_type)} • {task.items_count} soal • {task.min_words_target} kata
                      </p>
                      {task.module_book_title && (
                        <p className="text-xs text-slate-400 leading-tight mt-0.5">
                          Modul: {task.module_book_title}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-xs text-slate-400 text-right">
                      {formatDate(task.created_at)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => openDeleteDialog(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Tugas</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus tugas <strong>{getTaskToDelete()?.course_name || "ini"}</strong>? 
              Semua jawaban akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}