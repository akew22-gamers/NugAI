"use client"

import { useEffect, useRef, useCallback } from "react"
import { signOut } from "next-auth/react"

export function useInactivityLogout(timeoutMinutes: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeoutMs = timeoutMinutes * 60 * 1000

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      signOut({ callbackUrl: "/login" })
    }, timeoutMs)
  }, [timeoutMs])

  useEffect(() => {
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "touchmove",
      "click",
    ]

    const handleActivity = () => resetTimer()

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          signOut({ callbackUrl: "/login" })
        }, timeoutMs)
      } else {
        resetTimer()
      }
    }

    activityEvents.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    )
    document.addEventListener("visibilitychange", handleVisibilityChange)

    resetTimer()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      activityEvents.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      )
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [resetTimer, timeoutMs])
}
