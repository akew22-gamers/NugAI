"use client"

import { cn } from "@/lib/utils"

interface LoadingProps {
  text?: string
  className?: string
}

const dotKeyframes = `
@keyframes nugai-bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}
`

export function Loading({ text = "Memuat...", className }: LoadingProps) {
  return (
    <div className={cn("fixed inset-0 z-40 flex flex-col items-center justify-center lg:pl-64", className)}>
      <style dangerouslySetInnerHTML={{ __html: dotKeyframes }} />
      <div className="flex items-center gap-3">
        <span className="block w-3 h-3 rounded-full bg-purple-500" style={{ animation: "nugai-bounce 1.4s ease-in-out infinite" }} />
        <span className="block w-3 h-3 rounded-full bg-indigo-500" style={{ animation: "nugai-bounce 1.4s ease-in-out 0.2s infinite" }} />
        <span className="block w-3 h-3 rounded-full bg-pink-500" style={{ animation: "nugai-bounce 1.4s ease-in-out 0.4s infinite" }} />
      </div>
      {text && <p className="text-sm text-slate-500 mt-4">{text}</p>}
    </div>
  )
}

export function LoadingAdmin({ text = "Memuat...", className }: LoadingProps) {
  return (
    <div className={cn("fixed inset-0 z-40 flex flex-col items-center justify-center lg:pl-64", className)}>
      <style dangerouslySetInnerHTML={{ __html: dotKeyframes }} />
      <div className="flex items-center gap-3">
        <span className="block w-3 h-3 rounded-full bg-red-500" style={{ animation: "nugai-bounce 1.4s ease-in-out infinite" }} />
        <span className="block w-3 h-3 rounded-full bg-orange-500" style={{ animation: "nugai-bounce 1.4s ease-in-out 0.2s infinite" }} />
        <span className="block w-3 h-3 rounded-full bg-amber-500" style={{ animation: "nugai-bounce 1.4s ease-in-out 0.4s infinite" }} />
      </div>
      {text && <p className="text-sm text-slate-500 mt-4">{text}</p>}
    </div>
  )
}
