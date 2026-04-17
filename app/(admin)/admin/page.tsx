"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

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
        return <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Sehat</span>
      case 'warning':
        return <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">Menunggu</span>
      case 'error':
        return <span className="text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Error</span>
      default:
        return <span className="text-sm font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded">Unknown</span>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
        <p className="text-slate-600 mt-1">Kelola pengguna, pantau biaya API, dan kesehatan sistem</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Pengguna</CardTitle>
            <CardDescription>Siswa terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {isLoading ? "..." : summary?.totalUsers || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biaya API (30 Hari)</CardTitle>
            <CardDescription>LLM + Search API</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {isLoading ? "..." : formatCurrency(summary?.totalCostLast30Days || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tugas Dibuat</CardTitle>
            <CardDescription>Jumlah hari ini</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {isLoading ? "..." : summary?.tasksToday || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Kelola platform Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/users" className="block">
              <Card className="hover:bg-slate-50 transition cursor-pointer h-16">
                <CardContent className="px-4 py-0 h-full flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <div>
                    <p className="font-medium text-slate-900">Buat Pengguna Baru</p>
                    <p className="text-sm text-slate-500">Tambah akun siswa</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/analytics" className="block">
              <Card className="hover:bg-slate-50 transition cursor-pointer h-16">
                <CardContent className="px-4 py-0 h-full flex items-center gap-3">
                  <svg className="w-5 h-5 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-slate-900">Lihat Analitik</p>
                    <p className="text-sm text-slate-500">Pantau penggunaan & biaya</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kesehatan Sistem</CardTitle>
            <CardDescription>Monitoring status API</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-slate-500">Memuat...</p>
            ) : (
              <div className="space-y-3">
                {systems.map((system) => (
                  <div key={system.name} className="flex items-center justify-between">
                    <span className="text-slate-600">{system.name}</span>
                    {getStatusBadge(system.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}