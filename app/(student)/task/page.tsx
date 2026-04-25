"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { FileText, Plus, Trash2, Search, ChevronLeft, ChevronRight, Calendar, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { getCourseColorByName } from "@/lib/course-colors"

interface TaskSession {
  id: string
  task_type: "DISCUSSION" | "ASSIGNMENT"
  min_words_target: number
  created_at: string
  course_name: string | null
  module_book_title: string | null
  tutor_name: string | null
  ai_provider_name: string | null
  ai_model: string | null
  items_count: number
}

const ITEMS_PER_PAGE = 10

export default function TaskHistoryPage() {
  const { status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (status === "authenticated") {
      fetchTasks()
    }
  }, [status])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks?limit=100")
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

  const filteredTasks = useMemo(() => {
    let result = tasks

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (task) =>
          (task.course_name && task.course_name.toLowerCase().includes(q)) ||
          (task.module_book_title && task.module_book_title.toLowerCase().includes(q)) ||
          (task.tutor_name && task.tutor_name.toLowerCase().includes(q)) ||
          getTaskTypeLabel(task.task_type).toLowerCase().includes(q)
      )
    }

    if (dateFrom) {
      const from = new Date(dateFrom)
      from.setHours(0, 0, 0, 0)
      result = result.filter((task) => new Date(task.created_at) >= from)
    }

    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      result = result.filter((task) => new Date(task.created_at) <= to)
    }

    return result
  }, [tasks, searchQuery, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE))
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredTasks.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredTasks, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateFrom, dateTo])

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
    if (!dateString) return "-"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "-"
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTaskTypeLabel = (type: "DISCUSSION" | "ASSIGNMENT") => {
    return type === "DISCUSSION" ? "Diskusi" : "Soal"
  }

  const getLengthLabel = (minWords: number) => {
    if (minWords <= 150) return "Singkat"
    if (minWords >= 500) return "Panjang"
    return "Sedang"
  }

  const handleDeleteAll = async () => {
    setIsDeletingAll(true)
    try {
      const response = await fetch("/api/tasks", { method: "DELETE" })
      if (response.ok) {
        const data = await response.json()
        setTasks([])
        toast.success(`${data.deleted} tugas berhasil dihapus`)
      } else {
        toast.error("Gagal menghapus semua tugas")
      }
    } catch (error) {
      console.error("Failed to delete all tasks:", error)
      toast.error("Gagal menghapus semua tugas")
    } finally {
      setIsDeletingAll(false)
      setIsDeleteAllDialogOpen(false)
    }
  }

  const clearDateFilter = () => {
    setDateFrom("")
    setDateTo("")
    setShowDateFilter(false)
  }

  const hasDateFilter = dateFrom || dateTo

  const getTaskToDelete = () => tasks.find((t) => t.id === deleteTaskId)

  if (status === "loading" || isLoading) {
    return <Loading text="Memuat tugas..." />
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
        <div className="flex items-center gap-2">
          {tasks.length > 0 && (
            <Button
              variant="outline"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              onClick={() => setIsDeleteAllDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Hapus Semua</span>
            </Button>
          )}
          <Link href="/task/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Tugas Baru
            </Button>
          </Link>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center min-h-[350px] p-8">
          <div className="flex flex-col items-center text-center max-w-xs">
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mt-5">Belum ada tugas</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Anda belum pernah membuat tugas. Mulai buat tugas pertama dengan bantuan AI.
            </p>
            <Link href="/task/new" className="mt-5">
              <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4" />
                Buat Tugas Baru
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Cari mata kuliah, modul, atau tutor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showDateFilter || hasDateFilter ? "default" : "outline"}
              size="icon"
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`shrink-0 ${hasDateFilter ? "bg-purple-600 hover:bg-purple-700" : ""}`}
            >
              <Calendar className="w-4 h-4" />
            </Button>
          </div>

          {showDateFilter && (
            <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg border border-zinc-200 bg-slate-50">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-slate-500">Dari tanggal</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-slate-500">Sampai tanggal</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                />
              </div>
              {hasDateFilter && (
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateFilter}
                    className="text-slate-500 hover:text-slate-700 gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset
                  </Button>
                </div>
              )}
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="font-medium">Tidak ada tugas yang cocok</p>
              <p className="text-sm mt-1">Coba ubah kata kunci atau filter tanggal.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedTasks.map((task) => {
                  const color = getCourseColorByName(task.course_name || "")
                  return (
                    <div
                      key={task.id}
                      onClick={() => router.push(`/task/${task.id}`)}
                      className={`group relative rounded-xl border ${color.border} ${color.bg} p-4 cursor-pointer transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} />
                            <h3 className={`font-semibold truncate ${color.text}`}>
                              {task.course_name || "Tanpa Mata Kuliah"}
                            </h3>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              task.task_type === "DISCUSSION"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {getTaskTypeLabel(task.task_type)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span>{task.items_count} soal</span>
                            <span>•</span>
                            <span>{getLengthLabel(task.min_words_target)}</span>
                            <span>•</span>
                            <span>{formatDate(task.created_at)}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 p-0 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteDialog(task.id)
                          }}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <p className="text-sm text-slate-500">
                    {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredTasks.length)} dari {filteredTasks.length} tugas
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        if (totalPages <= 5) return true
                        if (page === 1 || page === totalPages) return true
                        return Math.abs(page - currentPage) <= 1
                      })
                      .map((page, idx, arr) => {
                        const prev = arr[idx - 1]
                        const showEllipsis = prev && page - prev > 1
                        return (
                          <span key={page} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-1 text-slate-400 text-sm">…</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={`h-8 w-8 p-0 ${currentPage === page ? "text-white" : ""}`}
                            >
                              {page}
                            </Button>
                          </span>
                        )
                      })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
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

      <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Semua Tugas</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <strong>semua {tasks.length} tugas</strong>? 
              Tindakan ini tidak dapat dibatalkan dan semua jawaban akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteAllDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
            >
              {isDeletingAll ? "Menghapus..." : "Hapus Semua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
