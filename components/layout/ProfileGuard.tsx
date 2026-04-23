"use client"

import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ProfileGuardProps {
  children: React.ReactNode
}

export function ProfileGuard({ children }: ProfileGuardProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return
    if (session.user.role === "ADMIN") {
      setHasProfile(true)
      return
    }

    fetch("/api/profile")
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error("No profile")
      })
      .then((data) => {
        const profile = data.data
        const isComplete = profile?.full_name && profile?.nim && profile?.university_name && profile?.study_program
        setHasProfile(!!isComplete)
      })
      .catch(() => setHasProfile(false))
  }, [status, session])

  useEffect(() => {
    if (hasProfile === false && pathname !== "/settings") {
      router.replace("/settings")
    }
  }, [hasProfile, pathname, router])

  if (status === "loading" || hasProfile === null) return null
  if (hasProfile === false && pathname !== "/settings") return null

  return <>{children}</>
}