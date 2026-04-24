import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'week'
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  const now = new Date()
  let fromDate: Date
  let toDate = new Date(now)

  if (period === 'custom' && fromParam && toParam) {
    fromDate = new Date(fromParam)
    toDate = new Date(toParam)
    const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays > 30) {
      return NextResponse.json({ error: 'Rentang maksimal 30 hari' }, { status: 400 })
    }
  } else {
    switch (period) {
      case 'day': fromDate = new Date(now.setHours(0,0,0,0)); break
      case 'week': fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break
      case 'month': fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break
      case 'year': fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break
      default: fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, username: true, role: true, subscription_tier: true,
      weekly_usage_count: true, weekly_regenerate_count: true, week_start_date: true,
      premium_started_at: true, premium_expires_at: true, premium_duration_months: true, premium_is_lifetime: true,
      student_profile: { select: { full_name: true, nim: true } },
    },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const taskSessions = await prisma.taskSession.findMany({
    where: { user_id: id, created_at: { gte: fromDate, lte: toDate } },
    select: { id: true, task_type: true, created_at: true, ai_provider_name: true, ai_provider_type: true, ai_model: true },
    orderBy: { created_at: 'desc' },
  })

  const usageLogs = await prisma.dailyUsageLog.findMany({
    where: { user_id: id, date: { gte: fromDate, lte: toDate } },
    select: { date: true, llm_tokens_used: true, tavily_calls: true, exa_calls: true, estimated_cost: true, ai_provider_name: true, ai_provider_type: true },
    orderBy: { date: 'desc' },
  })

  const totalTasks = taskSessions.length
  const discussionTasks = taskSessions.filter(t => t.task_type === 'DISCUSSION').length
  const assignmentTasks = taskSessions.filter(t => t.task_type === 'ASSIGNMENT').length
  const totalTokens = usageLogs.reduce((sum, l) => sum + (l.llm_tokens_used ?? 0), 0)
  const totalTavilyCalls = usageLogs.reduce((sum, l) => sum + l.tavily_calls, 0)
  const totalExaCalls = usageLogs.reduce((sum, l) => sum + l.exa_calls, 0)
  const totalCost = usageLogs.reduce((sum, l) => sum + (l.estimated_cost?.toNumber() || 0), 0)

  const providerUsage: Record<string, number> = {}
  taskSessions.forEach(t => {
    const key = t.ai_provider_name || 'Unknown'
    providerUsage[key] = (providerUsage[key] || 0) + 1
  })

  const dailyBreakdown: Record<string, { tasks: number; tokens: number; tavily: number; exa: number }> = {}
  taskSessions.forEach(t => {
    const day = new Date(t.created_at).toISOString().split('T')[0]
    if (!dailyBreakdown[day]) dailyBreakdown[day] = { tasks: 0, tokens: 0, tavily: 0, exa: 0 }
    dailyBreakdown[day].tasks++
  })
  usageLogs.forEach(l => {
    const day = new Date(l.date).toISOString().split('T')[0]
    if (!dailyBreakdown[day]) dailyBreakdown[day] = { tasks: 0, tokens: 0, tavily: 0, exa: 0 }
    dailyBreakdown[day].tokens += (l.llm_tokens_used ?? 0)
    dailyBreakdown[day].tavily += l.tavily_calls
    dailyBreakdown[day].exa += l.exa_calls
  })

  return NextResponse.json({
    user,
    stats: {
      totalTasks, discussionTasks, assignmentTasks,
      totalTokens, totalTavilyCalls, totalExaCalls, totalCost,
      providerUsage,
      dailyBreakdown,
      weeklyLimit: user.subscription_tier === 'FREE' ? { used: user.weekly_usage_count, limit: 3 } : null,
    },
    period: { from: fromDate.toISOString(), to: toDate.toISOString() },
  })
}
