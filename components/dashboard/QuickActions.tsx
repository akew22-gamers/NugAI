"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { BookOpen, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuickActions() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl shadow-black/20">
      <div>
        <h3 className="font-semibold text-white">Aksi Cepat</h3>
        <p className="text-sm text-zinc-500">Mulai dengan cepat</p>
      </div>

      <div className="mt-6 space-y-3">
        <Link href="/task/new">
          <Button
            className={cn(
              "w-full justify-start gap-3 h-auto p-4",
              "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
              "hover:opacity-90",
              "shadow-lg shadow-indigo-500/25 rounded-xl",
              "transition-all duration-300"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
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
        </Link>

        <Link href="/courses">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-3 h-auto p-4",
              "bg-white/5 border border-white/10 hover:bg-white/10",
              "text-white rounded-xl",
              "transition-all duration-300"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <BookOpen className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="flex-1 text-left">
              <span className="block font-semibold text-white">
                Kelola Mata Kuliah
              </span>
              <span className="text-xs text-zinc-400">
                Atur mata kuliah Anda
              </span>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-500" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
