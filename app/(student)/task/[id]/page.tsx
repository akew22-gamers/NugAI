"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Loader2, ArrowLeft, Download, Copy, Check, Trash2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loading } from "@/components/ui/loading"

interface TaskItem {
  id: string
  question_text: string
  answer_text: string | null
  status: string
  created_at: string
}

interface TaskSession {
  id: string
  task_type: "DISCUSSION" | "ASSIGNMENT"
  min_words_target: number
  created_at: string
  course_name_snapshot: string | null
  module_book_title_snapshot: string | null
  tutor_name_snapshot: string | null
  task_items: TaskItem[]
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { status } = useSession()
  const taskId = params?.id as string

  const [task, setTask] = useState<TaskSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (status === "authenticated" && taskId) {
      fetchTask()
    }
  }, [status, taskId])

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (response.ok) {
        const data = await response.json()
        setTask(data.task)
      } else if (response.status === 404) {
        toast.error("Tugas tidak ditemukan")
        router.push("/task")
      } else {
        toast.error("Gagal memuat tugas")
      }
    } catch (error) {
      console.error("Failed to fetch task:", error)
      toast.error("Gagal memuat tugas")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyAnswer = async (index: number) => {
    const answer = task?.task_items[index]?.answer_text
    if (!answer) return
    try {
      await navigator.clipboard.writeText(answer)
      setCopiedIndex(index)
      toast.success("Jawaban berhasil di-copy")
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      toast.error("Gagal copy jawaban")
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success("Tugas berhasil dihapus")
        router.push("/task")
      } else {
        toast.error("Gagal menghapus tugas")
      }
    } catch (error) {
      console.error("Failed to delete task:", error)
      toast.error("Gagal menghapus tugas")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: taskId,
          taskType: task?.task_type,
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
      a.download = `Tugas-${task?.course_name_snapshot || "Untitled"}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success("PDF berhasil di-download")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal generate PDF")
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

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length
  }

  const getLengthLabel = (minWords: number) => {
    if (minWords <= 150) return "Singkat"
    if (minWords >= 500) return "Panjang"
    return "Sedang"
  }

  if (status === "loading" || isLoading) {
    return (
      <Loading text="Memuat tugas..." />
    )
  }

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-zinc-400 mx-auto" />
          <h3 className="mt-4 font-semibold text-zinc-900">Tugas tidak ditemukan</h3>
          <Link href="/task" className="mt-4">
            <Button variant="outline">Kembali ke Riwayat</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link href="/task">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {task.course_name_snapshot || "Tugas Tanpa Mata Kuliah"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {task.task_type === "DISCUSSION" ? "Tugas Diskusi" : "Tugas Soal"} • {formatDate(task.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadPDF} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span> PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Hapus</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Tugas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500">Mata Kuliah</p>
              <p className="font-medium">{task.course_name_snapshot || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Modul/Buku</p>
              <p className="font-medium">{task.module_book_title_snapshot || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Tutor</p>
              <p className="font-medium">{task.tutor_name_snapshot || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Panjang Jawaban</p>
              <p className="font-medium">{getLengthLabel(task.min_words_target)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {task.task_items.map((item, index) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Soal {index + 1}</span>
                <div className="flex items-center gap-3">
                  {item.answer_text && (
                    <>
                      <span className="text-sm text-slate-500">
                        {countWords(item.answer_text)} kata
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyAnswer(index)}
                        className="gap-1"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copiedIndex === index ? "Copied!" : "Copy"}
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Pertanyaan:</p>
                <p className="text-slate-700 whitespace-pre-wrap">{item.question_text}</p>
              </div>
              {item.answer_text && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Jawaban:</p>
                  <div 
                    className="prose prose-sm max-w-none max-h-[400px] overflow-y-auto text-slate-700 whitespace-pre-wrap"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {item.answer_text}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Tugas</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus tugas ini? Semua jawaban akan dihapus permanen.
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