import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CRON_SECRET = process.env.CRON_SECRET

function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    return true
  }
  
  const cronHeader = request.headers.get('x-vercel-protection-bypass')
  if (cronHeader === CRON_SECRET) {
    return true
  }
  
  return false
}

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - diff)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const currentWeekStart = getWeekStart()
    const now = new Date()

    const quotaResult = await prisma.user.updateMany({
      where: {
        role: 'USER',
        week_start_date: {
          lt: currentWeekStart,
        },
      },
      data: {
        weekly_usage_count: 0,
        weekly_regenerate_count: 0,
        week_start_date: null,
      },
    })

    const expiredResult = await prisma.user.updateMany({
      where: {
        role: 'USER',
        subscription_tier: 'PREMIUM',
        premium_is_lifetime: false,
        premium_expires_at: {
          lte: now,
        },
      },
      data: {
        subscription_tier: 'FREE',
        premium_started_at: null,
        premium_expires_at: null,
        premium_duration_months: null,
      },
    })

    console.log(`[Cron] Quota reset: ${quotaResult.count} users reset, Premium expired: ${expiredResult.count} users downgraded`)

    return NextResponse.json({
      success: true,
      message: 'Quota reset and premium expiry check completed',
      usersQuotaReset: quotaResult.count,
      usersPremiumExpired: expiredResult.count,
    })
  } catch (error) {
    console.error('[Cron] Quota reset failed:', error)
    return NextResponse.json(
      { error: 'Quota reset failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
