import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generate } from '@/lib/ai'
import { buildRegenerationSystemPrompt, buildRegenerationUserPrompt } from '@/lib/prompts/regeneration'

interface RegenerateRequest {
  sessionId: string
  questionIndex: number
  instructions?: string
}

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: RegenerateRequest = await request.json()

    if (!body.sessionId || body.questionIndex === undefined) {
      return NextResponse.json({ error: 'Session ID and question index required' }, { status: 400 })
    }

    const taskSession = await prisma.taskSession.findUnique({
      where: { id: body.sessionId },
      include: {
        task_items: true,
        user: {
          include: { student_profile: true },
        },
      },
    })

    if (!taskSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (taskSession.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const taskItem = taskSession.task_items[body.questionIndex]
    if (!taskItem) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    if (taskItem.regenerate_count >= 5) {
      return NextResponse.json({ error: 'Regenerate limit reached (max 5)' }, { status: 403 })
    }

    const today = new Date().toISOString().split('T')[0]
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscription_tier: true,
        daily_usage_count: true,
        last_usage_date: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.last_usage_date?.toISOString().split('T')[0] !== today) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { daily_usage_count: 0, last_usage_date: today },
      })
    } else if (user.subscription_tier === 'FREE' && user.daily_usage_count >= 5) {
      return NextResponse.json({ error: 'Daily quota exceeded' }, { status: 403 })
    }

    const profile = taskSession.user.student_profile
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const systemPrompt = buildRegenerationSystemPrompt()
    const userPrompt = buildRegenerationUserPrompt({
      question_text: taskItem.question_text,
      previous_answer: taskItem.answer_text || '',
      regeneration_instructions: body.instructions,
    })

    const result = await generate({
      systemPrompt,
      userPrompt,
      maxTokens: taskSession.min_words_target * 2,
      temperature: 0.7,
    })

    await prisma.$transaction([
      prisma.taskItem.update({
        where: { id: taskItem.id },
        data: {
          answer_text: result.text,
          regenerate_count: { increment: 1 },
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { daily_usage_count: { increment: 1 } },
      }),
    ])

    return NextResponse.json({
      answer: result.text,
      regenerateCount: taskItem.regenerate_count + 1,
    })
  } catch (error) {
    console.error('Regeneration failed:', error)
    const message = error instanceof Error ? error.message : 'Regeneration failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}