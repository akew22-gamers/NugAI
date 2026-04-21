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
        return <span className="text-xs font-medium text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 py-1">Sehat</span>
      case 'warning':
        return <span className="text-xs font-medium text-amber-400 bg-amber-500/20 border border-amber-500/30 rounded-full px-3 py-1">Menunggu</span>
      case 'error':
        return <span className="text-xs font-medium text-red-400 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">Error</span>
      default:
        return <span className="text-xs font-medium text-zinc-400 bg-zinc-500/20 border border-zinc-500/30 rounded-full px-3 py-1">Unknown</span>
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
        .gradient-text {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .gradient-text-admin {
          background: linear-gradient(135deg, #ef4444 0%, #f97316 50%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-br from-amber-500/5 to-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Dashboard <span className="gradient-text-admin">Admin</span>
          </h1>
          <p className="text-zinc-400 mt-1">Kelola pengguna, pantau biaya API, dan kesehatan sistem</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl shadow-black/20 hover:border-white/20 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-zinc-400 text-sm mb-1">Total Pengguna</p>
            <p className="text-3xl font-bold text-white">
              {isLoading ? (
                <span className="inline-block w-16 h-8 bg-zinc-800 animate-pulse rounded-xl" />
              ) : (
                summary?.totalUsers || 0
              )}
            </p>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl shadow-black/20 hover:border-white/20 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-orange-400" />
            </div>
            <p className="text-zinc-400 text-sm mb-1">Biaya API (30 Hari)</p>
            <p className="text-3xl font-bold text-white">
              {isLoading ? (
                <span className="inline-block w-24 h-8 bg-zinc-800 animate-pulse rounded-xl" />
              ) : (
                formatCurrency(summary?.totalCostLast30Days || 0)
              )}
            </p>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl shadow-black/20 hover:border-white/20 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-zinc-400 text-sm mb-1">Tugas Dibuat Hari Ini</p>
            <p className="text-3xl font-bold text-white">
              {isLoading ? (
                <span className="inline-block w-12 h-8 bg-zinc-800 animate-pulse rounded-xl" />
              ) : (
                summary?.tasksToday || 0
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl shadow-black/20">
            <h2 className="text-white font-semibold text-lg">Aksi Cepat</h2>
            <p className="text-zinc-400 text-sm mb-4">Kelola platform Anda</p>
            <div className="space-y-3">
              <Link href="/admin/users">
                <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Buat Pengguna Baru</p>
                    <p className="text-sm text-zinc-400">Tambah akun siswa</p>
                  </div>
                </div>
              </Link>
              <Link href="/admin/analytics">
                <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Lihat Analitik</p>
                    <p className="text-sm text-zinc-400">Pantau penggunaan & biaya</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl shadow-black/20">
            <h2 className="text-white font-semibold text-lg">Kesehatan Sistem</h2>
            <p className="text-zinc-400 text-sm mb-4">Monitoring status API</p>
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-10 bg-zinc-800 animate-pulse rounded-xl" />
                <div className="h-10 bg-zinc-800 animate-pulse rounded-xl" />
                <div className="h-10 bg-zinc-800 animate-pulse rounded-xl" />
              </div>
            ) : (
              <div>
                {systems.map((system, index) => (
                  <div
                    key={system.name}
                    className={`flex items-center justify-between py-3 ${
                      index < systems.length - 1 ? "border-b border-white/5" : ""
                    }`}
                  >
                    <span className="text-zinc-300">{system.name}</span>
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
