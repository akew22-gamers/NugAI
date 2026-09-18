import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generate } from '@/lib/ai'
import { buildRegenerationSystemPrompt, buildRegenerationUserPrompt } from '@/lib/prompts/regeneration'

const WEEKLY_REGENERATE_LIMIT = 3

function sanitizeAnswer(text: string): string {
  let cleaned = text.trim()

  // Strip AI preamble/confirmation phrases (baris pertama yang merupakan konfirmasi AI)
  const preamblePatterns = [
    /^(?:Baik|Tentu|Berikut|Dengan senang hati|Saya akan|Ini adalah|Berikut adalah|Berikut ini|Di bawah ini|Saya sudah|Jawaban sudah|Revisi sudah|Sesuai permintaan|Berdasarkan feedback|Seperti yang diminta|Tentu saja)[^\n]*[.:]\s*\n*/i,
  ]
  for (const pattern of preamblePatterns) {
    cleaned = cleaned.replace(pattern, '').trim()
  }

  // Strip asterisks yang merupakan formatting marks (bold/italic markdown)
  cleaned = cleaned.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1') // **bold** atau *italic* → plain text
  cleaned = cleaned.replace(/\*/g, '') // sisa asterisks yang tidak berpasangan

  return cleaned
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

interface RegenerateRequest {
  sessionId: string
  questionIndex: number
  instructions?: string
  answer_length?: 'SHORT' | 'MEDIUM' | 'LONG'
  answer_style?: 'paragraph' | 'bullet' | 'math_steps' | 'combination'
}

async function ensureColumnsForRegenerate(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "task_sessions" ADD COLUMN IF NOT EXISTS "source_requirements" TEXT`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "task_items" ADD COLUMN IF NOT EXISTS "question_order" INTEGER`)
  } catch {
    // ignore
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureColumnsForRegenerate()
    const body: RegenerateRequest = await request.json()

    if (!body.sessionId || body.questionIndex === undefined) {
      return NextResponse.json({ error: 'Session ID and question index required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let taskSession: any = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let taskSessionAny: any = null
    try {
      taskSessionAny = await prisma.taskSession.findUnique({
        where: { id: body.sessionId },
        include: {
          task_items: {
            orderBy: [{ question_order: 'asc' }, { created_at: 'asc' }],
          },
          user: {
            include: { student_profile: true },
          },
        },
      })
      taskSession = taskSessionAny
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes("source_requirements") || message.includes("question_order")) {
        taskSessionAny = await prisma.taskSession.findUnique({
          where: { id: body.sessionId },
          include: { task_items: { orderBy: { created_at: 'asc' } }, user: { include: { student_profile: true } } },
        })
        if (taskSessionAny) {
          taskSessionAny.source_requirements = taskSessionAny.source_requirements ?? null
          taskSessionAny.task_items = taskSessionAny.task_items.map((item: { question_order?: number }, index: number) => ({ ...item, question_order: index + 1 }))
        }
        taskSession = taskSessionAny
      } else {
        throw error
      }
    }

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

    const currentWeekStart = getWeekStart()
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscription_tier: true,
        weekly_regenerate_count: true,
        week_start_date: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Per-item regenerate limit: FREE = 5, PREMIUM = 15
    const PER_ITEM_REGEN_LIMIT_FREE = 5
    const PER_ITEM_REGEN_LIMIT_PREMIUM = 15
    const perItemLimit = user.subscription_tier === 'PREMIUM' ? PER_ITEM_REGEN_LIMIT_PREMIUM : PER_ITEM_REGEN_LIMIT_FREE

    if (taskItem.regenerate_count >= perItemLimit) {
      return NextResponse.json({ error: `Regenerate limit reached (max ${perItemLimit}x per soal)` }, { status: 403 })
    }

    let weeklyRegenerateCount = user.weekly_regenerate_count

    if (user.week_start_date) {
      const userWeekStart = new Date(user.week_start_date)
      userWeekStart.setUTCHours(0, 0, 0, 0)

      if (userWeekStart.getTime() < currentWeekStart.getTime()) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            weekly_usage_count: 0,
            weekly_regenerate_count: 0,
            week_start_date: currentWeekStart,
          },
        })
        weeklyRegenerateCount = 0
      }
    } else {
      weeklyRegenerateCount = 0
    }

    if (user.subscription_tier === 'FREE' && weeklyRegenerateCount >= WEEKLY_REGENERATE_LIMIT) {
      return NextResponse.json({ error: 'Kuota mingguan regenerate habis (maks 3/minggu). Upgrade ke Premium untuk akses unlimited.' }, { status: 403 })
    }

    const profile = taskSession.user.student_profile
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const answerLengthMapping = (minWords: number): "SHORT" | "MEDIUM" | "LONG" => {
      if (minWords <= 150) return "SHORT"
      if (minWords >= 500) return "LONG"
      return "MEDIUM"
    }

    const answer_length = body.answer_length || answerLengthMapping(taskSession.min_words_target)
    const answer_style = body.answer_style || (taskSession as Record<string, unknown>).answer_style as string || 'paragraph'

    const regenerationContext = {
      question_text: taskItem.question_text,
      previous_answer: taskItem.answer_text || '',
      regeneration_instructions: body.instructions,
      task_type: taskSession.task_type,
      student_name: profile.full_name,
      student_nim: profile.nim,
      answer_length: answer_length,
      answer_style: answer_style as 'paragraph' | 'bullet' | 'math_steps' | 'combination',
      course_name: taskSession.course_name_snapshot || undefined,
      module_book_title: taskSession.module_book_title_snapshot || undefined,
      tutor_name: taskSession.tutor_name_snapshot || undefined,
      university_name: profile.university_name || undefined,
      source_requirements: taskSession.source_requirements || undefined,
    }

    const systemPrompt = buildRegenerationSystemPrompt(regenerationContext)
    const userPrompt = buildRegenerationUserPrompt(regenerationContext)

    let maxTokens = 4096
    if (answer_length === "SHORT") maxTokens = 2048
    if (answer_length === "LONG") maxTokens = 8192

    const result = await generate({
      systemPrompt,
      userPrompt,
      maxTokens: maxTokens,
      temperature: 0.7,
    })

    const sanitizedAnswer = sanitizeAnswer(result.text)

    const usedModel = result.model || null
    const usedProviderName = result.providerName || null

    await prisma.$transaction([
      prisma.taskItem.update({
        where: { id: taskItem.id },
        data: {
          answer_text: sanitizedAnswer,
          regenerate_count: { increment: 1 },
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          weekly_regenerate_count: { increment: 1 },
          week_start_date: currentWeekStart,
        },
      }),
    ])

    return NextResponse.json({
      answer: sanitizedAnswer,
      regenerateCount: taskItem.regenerate_count + 1,
      providerName: usedProviderName,
      model: usedModel,
    })
  } catch (error) {
    console.error('Regeneration failed:', error)
    const message = error instanceof Error ? error.message : 'Regeneration failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
