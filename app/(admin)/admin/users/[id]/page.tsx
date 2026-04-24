"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, RotateCcw, Calendar, 
  MessageSquare, BookOpen, Zap,
  Activity, DollarSign, Database
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import LoadingAdmin from "@/components/admin/loading-admin"

interface UserStatsData {
  user: {
    id: string
    username: string
    role: string
    subscription_tier: string
    daily_usage_count: number
    daily_regenerate_count: number
    last_usage_date: string | null
    student_profile: {
      full_name: string
      nim: string
    } | null
  }
  stats: {
    totalTasks: number
    discussionTasks: number
    assignmentTasks: number
    totalTokens: number
    totalTavilyCalls: number
    totalExaCalls: number
    totalCost: number
    providerUsage: Record<string, number>
    dailyBreakdown: Record<string, { tasks: number; tokens: number; tavily: number; exa: number }>
    dailyLimit: { used: number; limit: number } | null
  }
  period: {
    from: string
    to: string
  }
}

export default function UserStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [data, setData] = useState<UserStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<string>("week")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")

  const fetchStats = async () => {
    setLoading(true)
    try {
      let url = `/api/admin/users/${id}/stats?period=${period}`
      if (period === "custom") {
        if (!customFrom || !customTo) {
          setLoading(false)
          return
        }
        url += `&from=${customFrom}&to=${customTo}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        toast.error("Gagal memuat statistik user")
      }
    } catch (error) {
      toast.error("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (period !== "custom" || (customFrom && customTo)) {
      fetchStats()
    }
  }, [id, period, customFrom, customTo])

  const handleResetLimit = async () => {
    try {
      const response = await fetch(`/api/admin/users/${id}/reset-limit`, { method: "POST" })
      if (response.ok) {
        toast.success("Limit harian berhasil direset")
        fetchStats()
      } else {
        toast.error("Gagal mereset limit")
      }
    } catch {
      toast.error("Gagal mereset limit")
    }
  }

  if (loading && !data) return <LoadingAdmin />
  if (!data) return <div className="p-6 text-center">User not found or error loading data</div>

  const { user, stats } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {user.username}
          </h1>
          <p className="text-sm text-slate-500">
            {user.student_profile?.full_name || "Belum melengkapi profil"} 
            {user.student_profile?.nim && ` • ${user.student_profile.nim}`}
            {" "}• {user.subscription_tier} • {user.role}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {["day", "week", "month", "year", "custom"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === p 
                  ? "bg-white text-orange-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {p === "day" ? "Hari Ini" : 
               p === "week" ? "Minggu" : 
               p === "month" ? "Bulan" : 
               p === "year" ? "Tahun" : "Custom"}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="flex items-center gap-2 ml-4">
            <Input 
              type="date" 
              value={customFrom} 
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-auto h-9"
            />
            <span className="text-slate-500">sampai</span>
            <Input 
              type="date" 
              value={customTo} 
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-auto h-9"
            />
          </div>
        )}
      </div>

      {loading && <div className="text-center py-4 text-orange-600">Memperbarui data...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Total Tugas</CardTitle>
            <Activity className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalTasks}</div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Diskusi / Soal</CardTitle>
            <MessageSquare className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.discussionTasks} <span className="text-slate-400 font-normal text-lg">/</span> {stats.assignmentTasks}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Total Token AI</CardTitle>
            <Zap className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalTokens.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Tavily / Exa Calls</CardTitle>
            <Database className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalTavilyCalls} <span className="text-slate-400 font-normal text-lg">/</span> {stats.totalExaCalls}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Penggunaan Provider</CardTitle>
            <CardDescription>Model AI yang digunakan pada periode ini</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.providerUsage).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(stats.providerUsage).map(([provider, count]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{provider}</span>
                    <span className="bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {count} kali
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">Tidak ada data</div>
            )}
            
            {stats.dailyLimit && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Status Limit Hari Ini (FREE)</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Terpakai: {stats.dailyLimit.used} / {stats.dailyLimit.limit}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                    onClick={handleResetLimit}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
                  </Button>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${stats.dailyLimit.used >= stats.dailyLimit.limit ? 'bg-red-500' : 'bg-orange-500'}`} 
                    style={{ width: `${Math.min(100, (stats.dailyLimit.used / stats.dailyLimit.limit) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Breakdown Harian</CardTitle>
            <CardDescription>Rincian aktivitas pada periode ini</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.dailyBreakdown).length > 0 ? (
              <div className="rounded-md border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium">
                    <tr>
                      <th className="px-4 py-3 border-b border-slate-200">Tanggal</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-center">Tugas</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-right">Tokens</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-center">Tavily / Exa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.dailyBreakdown)
                      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                      .map(([date, data]) => (
                        <tr key={date} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {new Date(date).toLocaleDateString("id-ID", { weekday: 'short', day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-3 text-center">{data.tasks}</td>
                          <td className="px-4 py-3 text-right">{data.tokens.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">{data.tavily} / {data.exa}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">Tidak ada aktivitas pada periode ini</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
