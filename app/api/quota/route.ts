import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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
        daily_usage_count: true,
        last_usage_date: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan." },
        { status: 404 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let dailyUsageCount = user.daily_usage_count

    if (user.last_usage_date) {
      const lastUsageDate = new Date(user.last_usage_date)
      lastUsageDate.setHours(0, 0, 0, 0)
      
      if (lastUsageDate.getTime() < today.getTime()) {
        dailyUsageCount = 0
      }
    }

    const isPremium = user.subscription_tier === "PREMIUM"
    const limit = isPremium ? null : 5
    const remaining = isPremium ? null : Math.max(0, 5 - dailyUsageCount)

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    const resetAt = tomorrow.toISOString()

    return NextResponse.json({
      tier: user.subscription_tier,
      remaining,
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