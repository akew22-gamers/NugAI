import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generate } from '@/lib/ai'
import { combinedSearch, formatSearchResultsForPrompt } from '@/lib/search'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/prompts/task-generation'
import { isProviderConfigured } from '@/lib/ai'

interface GenerateTaskRequest {
  task_type: 'DISCUSSION' | 'ASSIGNMENT'
  course_id: string | null
  course_name: string
  module_book_title: string
  tutor_name: string
  min_words_target: number
  questions: string[]
}

async function checkQuota(userId: string): Promise<{ canProceed: boolean; error?: string }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscription_tier: true,
      daily_usage_count: true,
      daily_regenerate_count: true,
      last_usage_date: true,
    },
  })

  if (!user) {
    return { canProceed: false, error: 'User not found' }
  }

  const lastUsageStr = user.last_usage_date?.toISOString().split('T')[0]

  if (lastUsageStr !== todayStr) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        daily_usage_count: 0,
        daily_regenerate_count: 0,
        last_usage_date: today,
      },
    })
    return { canProceed: true }
  }

  if (user.subscription_tier === 'PREMIUM') {
    return { canProceed: true }
  }

  if (user.daily_usage_count >= 5) {
    return { canProceed: false, error: 'Kuota harian generate tugas habis (maks 5). Upgrade ke Premium untuk akses unlimited.' }
  }

  return { canProceed: true }
}

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'USER') {
    return NextResponse.json({ error: 'Only users can generate tasks' }, { status: 403 })
  }

  try {
    const body: GenerateTaskRequest = await request.json()

    if (!body.questions || body.questions.length === 0) {
      return NextResponse.json({ error: 'Questions are required' }, { status: 400 })
    }

    if (!body.course_name || !body.module_book_title) {
      return NextResponse.json({ error: 'Course info is required' }, { status: 400 })
    }

    const providerConfigured = await isProviderConfigured()
    if (!providerConfigured) {
      return NextResponse.json(
        { error: 'AI provider belum dikonfigurasi. Admin harus setup AI provider di /admin/providers' },
        { status: 503 }
      )
    }

    const quotaCheck = await checkQuota(session.user.id)
    if (!quotaCheck.canProceed) {
      return NextResponse.json({ error: quotaCheck.error }, { status: 403 })
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile tidak ditemukan. Silakan lengkapi profile di /settings' }, { status: 404 })
    }

    const searchQuery = `${body.course_name} ${body.module_book_title}`
    const searchResults = await combinedSearch({
      query: searchQuery,
      maxResults: 5,
    })
    const searchContext = formatSearchResultsForPrompt(searchResults.results)

    const answers: string[] = []
    let totalTokens = 0
    let usedProviderName: string | null = null
    let usedProviderType: string | null = null
    let usedModel: string | null = null

    // Hitung maxTokens yang cukup: ~2 token per kata + buffer 20%, minimal 2048
    const maxTokens = Math.min(Math.max(Math.ceil(body.min_words_target * 2.5), 2048), 4096)

    // Proses semua pertanyaan secara paralel untuk mengurangi total waktu tunggu
    const generationResults = await Promise.all(
      body.questions.map(async (question) => {
        const systemPrompt = buildSystemPrompt({
          study_program: profile.study_program,
          university_name: profile.university_name,
          course_name: body.course_name,
          module_book_title: body.module_book_title,
          tutor_name: body.tutor_name,
          min_words_target: body.min_words_target,
          task_type: body.task_type,
          question_text: question,
          search_context: searchContext,
        })

        const userPrompt = buildUserPrompt({
          study_program: profile.study_program,
          university_name: profile.university_name,
          course_name: body.course_name,
          module_book_title: body.module_book_title,
          tutor_name: body.tutor_name,
          min_words_target: body.min_words_target,
          task_type: body.task_type,
          question_text: question,
          search_context: searchContext,
          student_name: profile.full_name,
          student_nim: profile.nim,
        })

        return generate({
          systemPrompt,
          userPrompt,
          maxTokens,
          temperature: 0.7,
        })
      })
    )

    for (const result of generationResults) {
      answers.push(result.text)
      totalTokens += result.usage?.totalTokens || 0

      const castResult = result as any
      if ('providerName' in result && castResult.providerName) {
        usedProviderName = castResult.providerName || null
        usedProviderType = castResult.providerType || null
        usedModel = castResult.model || null
      }
    }

    const taskSession = await prisma.taskSession.create({
      data: {
        user_id: session.user.id,
        course_id: body.course_id,
        task_type: body.task_type,
        min_words_target: body.min_words_target,
        course_name_snapshot: body.course_name,
        module_book_title_snapshot: body.module_book_title,
        tutor_name_snapshot: body.tutor_name,
        ai_provider_name: usedProviderName,
        ai_provider_type: usedProviderType,
        ai_model: usedModel,
        task_items: {
          create: body.questions.map((question, index) => ({
            question_text: question,
            answer_text: answers[index],
            status: 'COMPLETED',
            references_used: searchResults.results.length > 0
              ? JSON.parse(JSON.stringify({ references: searchResults.results.slice(0, 2) }))
              : undefined,
          })),
        },
      },
      include: {
        task_items: true,
      },
    })

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          daily_usage_count: { increment: 1 },
          last_usage_date: new Date(),
        },
      }),
      prisma.dailyUsageLog.create({
        data: {
          user_id: session.user.id,
          session_id: taskSession.id,
          llm_tokens_used: totalTokens,
          tavily_calls: searchResults.tavilyResults,
          exa_calls: searchResults.exaResults,
          ai_provider_name: usedProviderName,
          ai_provider_type: usedProviderType,
          date: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      sessionId: taskSession.id,
      answers,
      references: searchResults.results.slice(0, 2).map((r) => ({
        type: r.type || 'web',
        title: r.title,
        url: r.url,
        author: r.metadata?.author as string | undefined,
      })),
      providerName: usedProviderName,
      providerType: usedProviderType,
    })
  } catch (error) {
    console.error('Task generation failed:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('API_KEY_ENCRYPTION_KEY')) {
        return NextResponse.json({ 
          error: 'Encryption key tidak valid. Periksa API_KEY_ENCRYPTION_KEY di environment.' 
        }, { status: 500 })
      }
      if (error.message.includes('No active AI provider')) {
        return NextResponse.json({ 
          error: 'AI provider belum dikonfigurasi. Admin harus setup di /admin/providers' 
        }, { status: 503 })
      }
      if (error.message.includes('Decryption failed')) {
        return NextResponse.json({ 
          error: 'API key tidak bisa di-decrypt. Encryption key berbeda dengan saat provider dibuat. Hapus provider dan buat baru.' 
        }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ error: 'Gagal generate jawaban' }, { status: 500 })
  }
}