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

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const result = await prisma.user.updateMany({
      where: {
        role: 'USER',
        last_usage_date: {
          lt: today,
        },
      },
      data: {
        daily_usage_count: 0,
        daily_regenerate_count: 0,
        last_usage_date: null,
      },
    })

    console.log(`[Cron] Quota reset completed: ${result.count} users reset`)

    return NextResponse.json({
      success: true,
      message: 'Quota reset completed',
      usersReset: result.count,
    })
  } catch (error) {
    console.error('[Cron] Quota reset failed:', error)
    return NextResponse.json(
      { error: 'Quota reset failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}