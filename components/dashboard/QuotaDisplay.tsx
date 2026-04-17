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
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="h-24 animate-pulse rounded-lg bg-zinc-100" />
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
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              isPremium
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
            )}
          >
            {isPremium ? (
              <Crown className="h-5 w-5" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">Kuota AI</h3>
            <p className="text-sm text-zinc-500">
              {isPremium ? "Paket Premium" : "Paket Free"}
            </p>
          </div>
        </div>
        {!isPremium && (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              remaining > 2
                ? "bg-green-100 text-green-800"
                : remaining > 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800"
            )}
          >
            {remaining > 0 ? `${remaining} tersisa` : "Habis"}
          </span>
        )}
      </div>

      <div className="mt-6">
        {isPremium ? (
          <div className="flex items-center gap-2 text-amber-700">
            <Crown className="h-5 w-5" />
            <span className="text-lg font-semibold">Unlimited</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">
                <span className="font-semibold text-zinc-900">{remaining}</span>
                <span className="text-zinc-400"> / {limit}</span>
                <span className="text-zinc-500"> tersisa</span>
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  remaining > 2
                    ? "bg-green-500"
                    : remaining > 0
                      ? "bg-amber-500"
                      : "bg-red-500"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
        <Clock className="h-4 w-4" />
        <span>Reset pukul {formatResetTime(quota?.resetAt)}</span>
      </div>
    </div>
  )
}
