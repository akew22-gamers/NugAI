"use client"

import { useInactivityLogout } from "@/hooks/useInactivityLogout"

interface InactivityGuardProps {
  timeoutMinutes: number
  children: React.ReactNode
}

export function InactivityGuard({ timeoutMinutes, children }: InactivityGuardProps) {
  useInactivityLogout(timeoutMinutes)
  return <>{children}</>
}
