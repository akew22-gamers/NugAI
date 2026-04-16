"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { BookOpen, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuickActions() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="font-semibold text-zinc-900">Aksi Cepat</h3>
        <p className="text-sm text-zinc-500">Mulai dengan cepat</p>
      </div>

      <div className="mt-6 space-y-3">
        <Link href="/task/new">
          <Button
            className={cn(
              "w-full justify-start gap-3 h-auto p-4",
              "bg-gradient-to-r from-zinc-900 to-zinc-800",
              "hover:from-zinc-800 hover:to-zinc-700",
              "transition-all duration-200"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <span className="block font-semibold">Buat Tugas AI</span>
              <span className="text-xs text-zinc-300">
                Generate tugas dengan AI
              </span>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-400" />
          </Button>
        </Link>

        <Link href="/courses">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-3 h-auto p-4",
              "border-zinc-200 bg-white hover:bg-zinc-50",
              "transition-all duration-200"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
              <BookOpen className="h-5 w-5 text-zinc-600" />
            </div>
            <div className="flex-1 text-left">
              <span className="block font-semibold text-zinc-900">
                Kelola Mata Kuliah
              </span>
              <span className="text-xs text-zinc-500">
                Atur mata kuliah Anda
              </span>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-400" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
