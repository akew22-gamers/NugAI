"use client"

import { useState } from "react"
import LoginForm from "@/components/auth/LoginForm"
import { AdminLoginModal } from "@/components/auth/AdminLoginModal"

export default function LoginPage() {
  const [adminModalOpen, setAdminModalOpen] = useState(false)

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Admin Login Icon - Top Right Corner */}
        <button
          onClick={() => setAdminModalOpen(true)}
          className="fixed top-4 right-4 p-3 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Login Admin"
          title="Login Admin"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

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

      <AdminLoginModal
        open={adminModalOpen}
        onOpenChange={setAdminModalOpen}
      />
    </>
  )
}