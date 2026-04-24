import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdminAuth() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

export async function GET() {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const totalUsers = await prisma.user.count({
      where: { role: 'USER' },
    })

    const premiumUsers = await prisma.user.count({
      where: { role: 'USER', subscription_tier: 'PREMIUM' },
    })

    const activeUsersToday = await prisma.dailyUsageLog.groupBy({
      by: ['user_id'],
      where: {
        date: { gte: today },
      },
    }).then(result => result.length)

    const tasksToday = await prisma.taskSession.count({
      where: {
        created_at: { gte: today },
      },
    })

    const tasksLast30Days = await prisma.taskSession.count({
      where: {
        created_at: { gte: thirtyDaysAgo },
      },
    })

    const dailyUsageLogs = await prisma.dailyUsageLog.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
      },
      select: {
        date: true,
        llm_tokens_used: true,
        tavily_calls: true,
        exa_calls: true,
        estimated_cost: true,
      },
      orderBy: { date: 'asc' },
    })

    const usageByDay = dailyUsageLogs.reduce((acc, log) => {
      const dateStr = log.date.toISOString().split('T')[0]
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          sessions: 0,
          tokens: 0,
          tavily_calls: 0,
          exa_calls: 0,
          cost: 0,
        }
      }
      acc[dateStr].sessions += 1
      acc[dateStr].tokens += log.llm_tokens_used || 0
      acc[dateStr].tavily_calls += log.tavily_calls
      acc[dateStr].exa_calls += log.exa_calls
      acc[dateStr].cost += Number(log.estimated_cost || 0)
      return acc
    }, {} as Record<string, { date: string; sessions: number; tokens: number; tavily_calls: number; exa_calls: number; cost: number }>)

    const totalCostLast30Days = dailyUsageLogs.reduce(
      (sum, log) => sum + Number(log.estimated_cost || 0),
      0
    )

    const totalTokensLast30Days = dailyUsageLogs.reduce(
      (sum, log) => sum + (log.llm_tokens_used || 0),
      0
    )

    const topUsers = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        username: true,
        student_profile: {
          select: {
            full_name: true,
          },
        },
        _count: {
          select: {
            task_sessions: true,
          },
        },
      },
      orderBy: {
        task_sessions: { _count: 'desc' },
      },
      take: 5,
    })

    return NextResponse.json({
      summary: {
        totalUsers,
        premiumUsers,
        freeUsers: totalUsers - premiumUsers,
        activeUsersToday,
        tasksToday,
        tasksLast30Days,
        totalCostLast30Days,
        totalTokensLast30Days,
      },
      usageByDay: Object.values(usageByDay),
      topUsers: topUsers.map((u) => ({
        id: u.id,
        username: u.username,
        full_name: u.student_profile?.full_name || null,
        task_count: u._count.task_sessions,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}