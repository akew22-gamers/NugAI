"use client"

import LoginForm from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">NugAI</h1>
            <p className="text-slate-600 mt-2">Asisten Akademik Berbasis AI</p>
          </div>

          <LoginForm />

          <div className="mt-8 text-center text-xs text-slate-400">
            <p>EAS Creative Studio 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}