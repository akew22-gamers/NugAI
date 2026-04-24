import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const WEEKLY_TASK_LIMIT = 3
const WEEKLY_REGENERATE_LIMIT = 3

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - diff)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscription_tier: true,
        weekly_usage_count: true,
        weekly_regenerate_count: true,
        week_start_date: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan." },
        { status: 404 }
      )
    }

    const currentWeekStart = getWeekStart()

    let weeklyUsageCount = user.weekly_usage_count
    let weeklyRegenerateCount = user.weekly_regenerate_count

    if (user.week_start_date) {
      const userWeekStart = new Date(user.week_start_date)
      userWeekStart.setUTCHours(0, 0, 0, 0)

      if (userWeekStart.getTime() < currentWeekStart.getTime()) {
        weeklyUsageCount = 0
        weeklyRegenerateCount = 0
      }
    } else {
      weeklyUsageCount = 0
      weeklyRegenerateCount = 0
    }

    const isPremium = user.subscription_tier === "PREMIUM"
    const limit = isPremium ? null : WEEKLY_TASK_LIMIT
    const remaining = isPremium ? null : Math.max(0, WEEKLY_TASK_LIMIT - weeklyUsageCount)
    const regenerateRemaining = isPremium ? null : Math.max(0, WEEKLY_REGENERATE_LIMIT - weeklyRegenerateCount)

    const nextMonday = new Date(currentWeekStart)
    nextMonday.setUTCDate(nextMonday.getUTCDate() + 7)
    const resetAt = nextMonday.toISOString()

    return NextResponse.json({
      tier: user.subscription_tier,
      remaining,
      regenerateRemaining,
      limit,
      resetAt,
    })
  } catch (error) {
    console.error("Error fetching quota:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data kuota." },
      { status: 500 }
    )
  }
}
