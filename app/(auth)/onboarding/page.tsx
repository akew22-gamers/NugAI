"use client"

import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Nug<span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)" }}>AI</span></h1>
            <p className="text-slate-600 mt-2">Complete your setup</p>
          </div>

          <OnboardingWizard />

          <div className="mt-8 text-center text-xs text-slate-400">
            <p>EAS Creative Studio 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
