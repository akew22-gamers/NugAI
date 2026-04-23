"use client"

import { cn } from "@/lib/utils"

interface LoadingProps {
  text?: string
  className?: string
}

export function Loading({ text = "Memuat...", className }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center w-full min-h-[60vh]", className)}>
      <style jsx>{`
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
          style={{ animation: "bounce-dot 1.4s ease-in-out infinite", animationDelay: "0s" }}
        />
        <div
          className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
          style={{ animation: "bounce-dot 1.4s ease-in-out infinite", animationDelay: "0.2s" }}
        />
        <div
          className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          style={{ animation: "bounce-dot 1.4s ease-in-out infinite", animationDelay: "0.4s" }}
        />
      </div>
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  )
}

export function LoadingAdmin({ text = "Memuat...", className }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center w-full min-h-[60vh]", className)}>
      <style jsx>{`
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500"
          style={{ animation: "bounce-dot 1.4s ease-in-out infinite", animationDelay: "0s" }}
        />
        <div
          className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
          style={{ animation: "bounce-dot 1.4s ease-in-out infinite", animationDelay: "0.2s" }}
        />
        <div
          className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-red-500"
          style={{ animation: "bounce-dot 1.4s ease-in-out infinite", animationDelay: "0.4s" }}
        />
      </div>
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  )
}
