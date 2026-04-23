"use client"

import { cn } from "@/lib/utils"

interface LoadingProps {
  text?: string
  className?: string
}

const dotAnim = (delay: string): React.CSSProperties => ({
  animation: `nugai-bounce 1.4s ease-in-out ${delay} infinite`,
})

const keyframes = "@keyframes nugai-bounce{0%,80%,100%{transform:scale(0);opacity:.3}40%{transform:scale(1);opacity:1}}"

export function Loading({ text = "Memuat...", className }: LoadingProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />
      <div className={cn("flex-1 flex flex-col items-center justify-center w-full", className)}>
        <div className="flex items-center gap-3">
          <span className="block w-3 h-3 rounded-full bg-purple-500" style={dotAnim("0s")} />
          <span className="block w-3 h-3 rounded-full bg-indigo-500" style={dotAnim("0.2s")} />
          <span className="block w-3 h-3 rounded-full bg-pink-500" style={dotAnim("0.4s")} />
        </div>
        {text && <p className="text-sm text-slate-500 mt-4">{text}</p>}
      </div>
    </>
  )
}

export function LoadingAdmin({ text = "Memuat...", className }: LoadingProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />
      <div className={cn("flex-1 flex flex-col items-center justify-center w-full", className)}>
        <div className="flex items-center gap-3">
          <span className="block w-3 h-3 rounded-full bg-red-500" style={dotAnim("0s")} />
          <span className="block w-3 h-3 rounded-full bg-orange-500" style={dotAnim("0.2s")} />
          <span className="block w-3 h-3 rounded-full bg-amber-500" style={dotAnim("0.4s")} />
        </div>
        {text && <p className="text-sm text-slate-500 mt-4">{text}</p>}
      </div>
    </>
  )
}
