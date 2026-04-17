"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { QuotaDisplay } from "@/components/dashboard/QuotaDisplay"
import { RecentTasks } from "@/components/dashboard/RecentTasks"
import { QuickActions } from "@/components/dashboard/QuickActions"

interface QuotaData {
  tier: "FREE" | "PREMIUM"
  remaining: number | null
  limit: number | null
  resetAt: string
}

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

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [recentTasks, setRecentTasks] = useState<TaskSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const quotaRes = await fetch("/api/quota")
        if (quotaRes.ok) {
          const quotaData = await quotaRes.json()
          setQuota(quotaData)
        }

        const tasksRes = await fetch("/api/tasks?limit=5")
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          setRecentTasks(tasksData.tasks || [])
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchDashboardData()
    }
  }, [status])

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 mx-auto" />
          <p className="mt-2 text-sm text-zinc-500">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500">Silakan login untuk mengakses dashboard</p>
          <Link href="/login">
            <Button className="mt-4">Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  const userName = session?.user?.username || "Pengguna"
  const subscriptionTier = session?.user?.subscriptionTier || "FREE"

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Selamat datang, {userName}
          </h1>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              subscriptionTier === "PREMIUM"
                ? "bg-amber-100 text-amber-800"
                : "bg-zinc-100 text-zinc-800"
            )}
          >
            {subscriptionTier === "PREMIUM" ? "PREMIUM" : "FREE"}
          </span>
        </div>
        <p className="text-zinc-500">
          Kelola tugas dan kuota pembelajaran AI Anda di satu tempat
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <QuotaDisplay quota={quota} isLoading={isLoading} />
        <QuickActions />
      </div>

      <RecentTasks tasks={recentTasks} isLoading={isLoading} />
    </div>
  )
}