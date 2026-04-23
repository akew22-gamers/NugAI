"use client"

import { cn } from "@/lib/utils"

interface LoadingProps {
  text?: string
  className?: string
}

function BounceDots({ colors }: { colors: [string, string, string] }) {
  return (
    <>
      <style jsx>{`
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div className="flex items-center gap-2">
        {colors.map((color, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${color}`}
            style={{ animation: "bounce-dot 1.4s ease-in-out infinite", animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </>
  )
}

export function Loading({ text = "Memuat...", className }: LoadingProps) {
  return (
    <div className={cn("fixed inset-0 z-40 flex flex-col items-center justify-center lg:pl-64", className)}>
      <BounceDots colors={[
        "bg-gradient-to-r from-purple-500 to-indigo-500",
        "bg-gradient-to-r from-indigo-500 to-purple-500",
        "bg-gradient-to-r from-purple-500 to-pink-500",
      ]} />
      {text && <p className="text-sm text-slate-500 mt-4">{text}</p>}
    </div>
  )
}

export function LoadingAdmin({ text = "Memuat...", className }: LoadingProps) {
  return (
    <div className={cn("fixed inset-0 z-40 flex flex-col items-center justify-center lg:pl-64", className)}>
      <BounceDots colors={[
        "bg-gradient-to-r from-red-500 to-orange-500",
        "bg-gradient-to-r from-orange-500 to-amber-500",
        "bg-gradient-to-r from-amber-500 to-red-500",
      ]} />
      {text && <p className="text-sm text-slate-500 mt-4">{text}</p>}
    </div>
  )
}
