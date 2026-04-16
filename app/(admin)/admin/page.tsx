"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AdminDashboardPage() {
  const { data: session } = useSession()

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
            <p className="text-3xl font-bold text-slate-900">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biaya API (Hari Ini)</CardTitle>
            <CardDescription>DeepSeek + Search API</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">$0.00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tugas Dibuat</CardTitle>
            <CardDescription>Jumlah hari ini</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">0</p>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">DeepSeek API</span>
                <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">Menunggu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tavily Search</span>
                <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">Menunggu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Exa Search</span>
                <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">Menunggu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Database</span>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Sehat</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}