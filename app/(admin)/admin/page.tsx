"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, DollarSign, FileText, UserPlus, BarChart3 } from "lucide-react"

interface SystemHealth {
  name: string
  status: 'healthy' | 'warning' | 'error'
  message: string
}

interface AnalyticsSummary {
  totalUsers: number
  activeUsersToday: number
  tasksToday: number
  totalCostLast30Days: number
}

export default function AdminDashboardPage() {
  const [systems, setSystems] = useState<SystemHealth[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [healthRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/system-health"),
        fetch("/api/admin/analytics"),
      ])

      if (healthRes.ok) {
        const healthData = await healthRes.json()
        setSystems(healthData.systems)
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setSummary(analyticsData.summary)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <span className="bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-medium">Sehat</span>
      case 'warning':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-xs font-medium">Menunggu</span>
      case 'error':
        return <span className="bg-red-50 text-red-700 border border-red-200 rounded-full px-3 py-1 text-xs font-medium">Error</span>
      default:
        return <span className="bg-zinc-50 text-zinc-600 border border-zinc-200 rounded-full px-3 py-1 text-xs font-medium">Unknown</span>
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <>
      <style jsx global>{`
        .gradient-text-admin {
          background: linear-gradient(135deg, #ef4444 0%, #f97316 50%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard <span className="gradient-text-admin">Admin</span>
          </h1>
          <p className="text-slate-500 mt-1">Kelola pengguna, pantau biaya API, dan kesehatan sistem</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg shadow-zinc-200/50 hover:shadow-xl hover:shadow-zinc-200/60 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-slate-500 text-sm mb-1">Total Pengguna</p>
            <p className="text-3xl font-bold text-slate-900">
              {isLoading ? (
                <span className="inline-block w-16 h-8 bg-zinc-100 animate-pulse rounded-xl" />
              ) : (
                summary?.totalUsers || 0
              )}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg shadow-zinc-200/50 hover:shadow-xl hover:shadow-zinc-200/60 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-slate-500 text-sm mb-1">Biaya API (30 Hari)</p>
            <p className="text-3xl font-bold text-slate-900">
              {isLoading ? (
                <span className="inline-block w-24 h-8 bg-zinc-100 animate-pulse rounded-xl" />
              ) : (
                formatCurrency(summary?.totalCostLast30Days || 0)
              )}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg shadow-zinc-200/50 hover:shadow-xl hover:shadow-zinc-200/60 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-slate-500 text-sm mb-1">Tugas Dibuat Hari Ini</p>
            <p className="text-3xl font-bold text-slate-900">
              {isLoading ? (
                <span className="inline-block w-12 h-8 bg-zinc-100 animate-pulse rounded-xl" />
              ) : (
                summary?.tasksToday || 0
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg shadow-zinc-200/50 hover:shadow-xl hover:shadow-zinc-200/60 transition-all duration-300">
            <h2 className="text-slate-900 font-semibold text-lg">Aksi Cepat</h2>
            <p className="text-slate-500 text-sm mb-4">Kelola platform Anda</p>
            <div className="space-y-3">
              <Link href="/admin/users">
                <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-zinc-100 hover:border-zinc-200 transition-all duration-200 cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Buat Pengguna Baru</p>
                    <p className="text-sm text-slate-500">Tambah akun siswa</p>
                  </div>
                </div>
              </Link>
              <Link href="/admin/analytics">
                <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-zinc-100 hover:border-zinc-200 transition-all duration-200 cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Lihat Analitik</p>
                    <p className="text-sm text-slate-500">Pantau penggunaan & biaya</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg shadow-zinc-200/50 hover:shadow-xl hover:shadow-zinc-200/60 transition-all duration-300">
            <h2 className="text-slate-900 font-semibold text-lg">Kesehatan Sistem</h2>
            <p className="text-slate-500 text-sm mb-4">Monitoring status API</p>
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-10 bg-zinc-100 animate-pulse rounded-xl" />
                <div className="h-10 bg-zinc-100 animate-pulse rounded-xl" />
                <div className="h-10 bg-zinc-100 animate-pulse rounded-xl" />
              </div>
            ) : (
              <div>
                {systems.map((system, index) => (
                  <div
                    key={system.name}
                    className={`flex items-center justify-between py-3 ${
                      index < systems.length - 1 ? "border-b border-zinc-100" : ""
                    }`}
                  >
                    <span className="text-slate-700">{system.name}</span>
                    {getStatusBadge(system.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
