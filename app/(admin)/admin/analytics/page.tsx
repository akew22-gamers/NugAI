"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Summary {
  totalUsers: number
  premiumUsers: number
  freeUsers: number
  activeUsersToday: number
  tasksToday: number
  tasksLast30Days: number
  totalCostLast30Days: number
  totalTokensLast30Days: number
}

interface UsageByDay {
  date: string
  sessions: number
  tokens: number
  tavily_calls: number
  exa_calls: number
  cost: number
}

interface TopUser {
  id: string
  username: string
  full_name: string | null
  task_count: number
}

interface AnalyticsData {
  summary: Summary
  usageByDay: UsageByDay[]
  topUsers: TopUser[]
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/analytics")
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
    }).format(value)
  }

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("id-ID").format(value)
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-500">Memuat analytics...</div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-slate-500">
        Gagal memuat data analytics
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analitik</h1>
        <p className="text-slate-600 mt-1">
          Pantau penggunaan dan biaya API
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Pengguna</CardTitle>
            <CardDescription>Siswa terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-slate-900">
                {formatNumber(data.summary.totalUsers)}
              </p>
              <div className="flex gap-4 text-sm text-slate-600">
                <span>{data.summary.premiumUsers} Premium</span>
                <span>{data.summary.freeUsers} Free</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aktif Hari Ini</CardTitle>
            <CardDescription>Pengguna aktif</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {formatNumber(data.summary.activeUsersToday)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tugas Hari Ini</CardTitle>
            <CardDescription>Sessions created</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {formatNumber(data.summary.tasksToday)}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {formatNumber(data.summary.tasksLast30Days)} dalam 30 hari
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Biaya 30 Hari</CardTitle>
            <CardDescription>Estimated API cost</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency(data.summary.totalCostLast30Days)}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {formatNumber(data.summary.totalTokensLast30Days)} tokens
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Penggunaan Harian (30 Hari)</CardTitle>
            <CardDescription>Trend sessions dan tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.usageByDay.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada data usage</p>
              ) : (
                <div className="space-y-2">
                  {data.usageByDay.slice(-7).map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-600">
                        {new Date(day.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <div className="flex gap-4">
                        <span className="text-slate-900">
                          {day.sessions} sessions
                        </span>
                        <span className="text-slate-500">
                          {formatNumber(day.tokens)} tokens
                        </span>
                        <span className="text-slate-500">
                          {formatCurrency(day.cost)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Pengguna</CardTitle>
            <CardDescription>Pengguna dengan tugas terbanyak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topUsers.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada data pengguna</p>
              ) : (
                <div className="space-y-2">
                  {data.topUsers.map((user, index) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">
                          #{index + 1}
                        </span>
                        <span className="text-slate-900 font-medium">
                          {user.full_name || user.username}
                        </span>
                      </div>
                      <span className="text-slate-600">
                        {formatNumber(user.task_count)} tugas
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistik API Calls</CardTitle>
          <CardDescription>Penggunaan search API dalam 30 hari</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Tavily Calls</p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(
                  data.usageByDay.reduce((sum, d) => sum + d.tavily_calls, 0)
                )}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Exa Calls</p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(
                  data.usageByDay.reduce((sum, d) => sum + d.exa_calls, 0)
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}