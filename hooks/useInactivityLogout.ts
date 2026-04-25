"use client"

import { useEffect, useRef, useCallback } from "react"
import { signOut } from "next-auth/react"

const STORAGE_KEY = "nugai_last_activity"

export function useInactivityLogout(timeoutMinutes: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeoutMs = timeoutMinutes * 60 * 1000

  const updateLastActivity = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
    } catch {}
  }, [])

  const checkElapsedTime = useCallback(() => {
    try {
      const last = localStorage.getItem(STORAGE_KEY)
      if (last) {
        const elapsed = Date.now() - parseInt(last, 10)
        if (elapsed >= timeoutMs) {
          signOut({ callbackUrl: "/login" })
          return true
        }
      }
    } catch {}
    return false
  }, [timeoutMs])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    updateLastActivity()
    timerRef.current = setTimeout(() => {
      signOut({ callbackUrl: "/login" })
    }, timeoutMs)
  }, [timeoutMs, updateLastActivity])

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
      if (document.visibilityState === "visible") {
        if (checkElapsedTime()) return
        resetTimer()
      } else {
        if (timerRef.current) clearTimeout(timerRef.current)
        updateLastActivity()
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
  }, [resetTimer, checkElapsedTime, updateLastActivity])
}
