"use client"

import { cn } from "@/lib/utils"
import { Zap, Clock, Crown } from "lucide-react"

interface QuotaData {
  tier: "FREE" | "PREMIUM"
  remaining: number | null
  limit: number | null
  resetAt: string
}

interface QuotaDisplayProps {
  quota: QuotaData | null
  isLoading?: boolean
}

export function QuotaDisplay({ quota, isLoading }: QuotaDisplayProps) {
  if (isLoading && !quota) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg shadow-zinc-200/50 p-6">
        <div className="h-24 animate-pulse rounded-xl bg-zinc-100" />
      </div>
    )
  }

  const isPremium = quota?.tier === "PREMIUM"
  const remaining = quota?.remaining ?? 0
  const limit = quota?.limit ?? 5
  const percentage = isPremium ? 100 : Math.max(0, (remaining / limit) * 100)

  const formatResetTime = (resetAt: string | undefined) => {
    if (!resetAt) return "-"
    const date = new Date(resetAt)
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg shadow-zinc-200/50 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              isPremium
                ? "bg-amber-50 text-amber-600"
                : "bg-indigo-50 text-indigo-600"
            )}
          >
            {isPremium ? (
              <Crown className="h-5 w-5" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Kuota AI</h3>
            <p className="text-sm text-slate-500">
              {isPremium ? "Paket Premium" : "Paket Free"}
            </p>
          </div>
        </div>
        {!isPremium && (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              remaining > 2
                ? "bg-green-50 text-green-700 border border-green-200"
                : remaining > 0
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-red-50 text-red-700 border border-red-200"
            )}
          >
            {remaining > 0 ? `${remaining} tersisa` : "Habis"}
          </span>
        )}
      </div>

      <div className="mt-6">
        {isPremium ? (
          <div className="flex items-center gap-2 text-amber-600">
            <Crown className="h-5 w-5" />
            <span className="text-lg font-semibold">Unlimited</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                <span className="font-semibold text-slate-900">{remaining}</span>
                <span className="text-slate-400"> / {limit}</span>
                <span className="text-slate-400"> tersisa</span>
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  remaining > 2
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                    : remaining > 0
                      ? "bg-gradient-to-r from-amber-500 to-orange-500"
                      : "bg-gradient-to-r from-red-500 to-pink-500"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
        <Clock className="h-4 w-4" />
        <span>Reset pukul {formatResetTime(quota?.resetAt)}</span>
      </div>
    </div>
  )
}
