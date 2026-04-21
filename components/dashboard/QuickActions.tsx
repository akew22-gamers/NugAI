"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, ArrowRight, Sparkles, MessageSquareText, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useState } from "react"

export function QuickActions() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSelect = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg shadow-zinc-200/50 p-6">
      <div>
        <h3 className="font-semibold text-slate-900">Aksi Cepat</h3>
        <p className="text-sm text-slate-500">Mulai dengan cepat</p>
      </div>

      <div className="mt-6 space-y-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className={cn(
                "w-full justify-start gap-3 h-auto p-4",
                "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
                "hover:opacity-90",
                "shadow-lg shadow-indigo-500/25 rounded-xl",
                "transition-all duration-300"
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <span className="block font-semibold text-white">Buat Tugas AI</span>
                <span className="text-xs text-white/70">
                  Generate tugas dengan AI
                </span>
              </div>
              <ArrowRight className="h-5 w-5 text-white/70" />
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pilih Jenis Tugas</DialogTitle>
              <DialogDescription>
                Pilih jenis tugas yang ingin Anda buat dengan AI
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                onClick={() => handleSelect("/task/diskusi/new")}
                className="group flex items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 shrink-0">
                  <MessageSquareText className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 group-hover:text-indigo-700">
                    Tugas Diskusi
                  </p>
                  <p className="text-sm text-slate-500">
                    Generate jawaban tugas diskusi forum
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              <button
                onClick={() => handleSelect("/task/soal/new")}
                className="group flex items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 shrink-0">
                  <ClipboardCheck className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 group-hover:text-purple-700">
                    Tugas Soal
                  </p>
                  <p className="text-sm text-slate-500">
                    Generate jawaban tugas soal/assignment
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Link href="/courses">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-3 h-auto p-4",
              "bg-zinc-50 border border-zinc-200 hover:bg-zinc-100",
              "text-slate-900 rounded-xl",
              "transition-all duration-300"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-zinc-200">
              <BookOpen className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex-1 text-left">
              <span className="block font-semibold text-slate-900">
                Kelola Mata Kuliah
              </span>
              <span className="text-xs text-slate-500">
                Atur mata kuliah Anda
              </span>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
