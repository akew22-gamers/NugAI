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
    const retentionMonths = 12
    const purgeDate = new Date()
    purgeDate.setMonth(purgeDate.getMonth() - retentionMonths)

    let totalSessionsPurged = 0
    let totalItemsPurged = 0

    const usersToPurge = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        username: true,
        task_sessions: {
          where: {
            created_at: { lt: purgeDate },
          },
          include: {
            task_items: {
              select: { id: true },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    })

    for (const user of usersToPurge) {
      if (user.task_sessions.length === 0) {
        continue
      }

      const sessionIds = user.task_sessions.map((s) => s.id)
      let userItemsPurged = 0

      for (const session of user.task_sessions) {
        userItemsPurged += session.task_items.length
      }

      await prisma.taskItem.deleteMany({
        where: { session_id: { in: sessionIds } },
      })

      await prisma.taskSession.deleteMany({
        where: { id: { in: sessionIds } },
      })

      await prisma.dataPurgeLog.create({
        data: {
          user_id: user.id,
          username_snapshot: user.username,
          sessions_purged: user.task_sessions.length,
          items_purged: userItemsPurged,
          reason: `Auto-purge: ${retentionMonths} months retention policy`,
        },
      })

      totalSessionsPurged += user.task_sessions.length
      totalItemsPurged += userItemsPurged
    }

    console.log(`[Cron] Data purge completed: ${totalSessionsPurged} sessions, ${totalItemsPurged} items`)

    return NextResponse.json({
      success: true,
      message: 'Data purge completed',
      sessionsPurged: totalSessionsPurged,
      itemsPurged: totalItemsPurged,
    })
  } catch (error) {
    console.error('[Cron] Data purge failed:', error)
    return NextResponse.json(
      { error: 'Data purge failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}