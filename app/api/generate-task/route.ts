import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generate, isProviderConfigured } from '@/lib/ai'
import { getActiveProvidersOrdered } from '@/lib/ai-failover'
import { combinedSearch, formatSearchResultsForPrompt, searchModuleMetadata } from '@/lib/search'
import { parseBatchResponse, type BatchAnswer } from '@/lib/generation/batch-contract'

interface GenerateTaskRequest {
  task_type: 'DISCUSSION' | 'ASSIGNMENT'
  task_description?: string
  source_requirements?: string
  course_id: string | null
  course_name: string
  module_book_title: string
  tutor_name: string
  answer_length: 'SHORT' | 'MEDIUM' | 'LONG'
  answer_style: 'paragraph' | 'bullet' | 'math_steps' | 'combination'
  questions: string[]
}

const lengthConfig = (length: GenerateTaskRequest['answer_length']) => {
  if (length === 'SHORT') return { minWords: 150, maxTokens: 2048 }
  if (length === 'LONG') return { minWords: 500, maxTokens: 8192 }
  return { minWords: 300, maxTokens: 4096 }
}

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - (day === 0 ? 6 : day - 1))
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

function buildBatchPrompt(body: GenerateTaskRequest, profile: { study_program: string; university_name: string }, searchContext: string, moduleMetadata: string) {
  const questions = body.questions.map((question, index) => `${index + 1}. ${question}`).join('\n\n')
  const style = body.answer_style === 'bullet' ? 'poin/numbering' : body.answer_style === 'math_steps' ? 'langkah matematika' : body.answer_style === 'combination' ? 'kombinasi paragraf dan poin' : 'paragraf naratif'
  const words = body.answer_length === 'SHORT' ? 'sekitar 150 kata' : body.answer_length === 'LONG' ? 'sekitar 500 kata' : 'sekitar 300 kata'
  return {
    systemPrompt: `Kamu menjawab tugas akademik Bahasa Indonesia. Jawab substansi setiap soal secara mandiri. Jangan tulis header mahasiswa, salam pembuka, footer, judul dokumen, atau daftar referensi di dalam answer karena aplikasi menyusunnya sendiri. Gaya jawaban: ${style}. Target panjang per soal: ${words}. Gunakan sumber nyata dari konteks yang tersedia dan jangan mengarang bibliografi. Kembalikan JSON valid saja tanpa markdown atau code fence dengan bentuk {"answers":[{"questionOrder":1,"answer":"markdown jawaban", "references":[{"type":"journal|book|module|government|web","title":"...","url":"...","author":"...","year":"..."}]}]}. Setiap questionOrder harus muncul tepat sekali.`,
    userPrompt: `Mata kuliah: ${body.course_name}\nModul/buku utama: ${body.module_book_title}\nTutor: ${body.tutor_name}\nProgram studi: ${profile.study_program}\nUniversitas: ${profile.university_name}\nKebutuhan sumber user: ${body.source_requirements || 'Gunakan sumber akademik yang relevan.'}\n${body.task_description ? `Konteks tugas:\n${body.task_description}\n` : ''}\nSoal:\n${questions}\n\nMetadata modul:\n${moduleMetadata || '-'}\n\nKonteks pencarian:\n${searchContext || '-'}`,
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'USER') return NextResponse.json({ error: 'Only users can generate tasks' }, { status: 403 })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: string, data: Record<string, unknown>) => controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`))
      let taskSessionId: string | undefined
      try {
        const body = await request.json() as GenerateTaskRequest
        body.source_requirements = body.source_requirements?.slice(0, 2000)
        if (!body.questions?.length || body.questions.length > 5 || !body.course_name || !body.module_book_title || !body.tutor_name) throw new Error('Data tugas tidak lengkap atau jumlah soal tidak valid')
        if (!(await isProviderConfigured())) throw new Error('AI provider belum dikonfigurasi')
        emit('progress', { stage: 'validating', message: 'Memvalidasi tugas dan menyiapkan sesi...', items: [] })

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { subscription_tier: true, weekly_usage_count: true, week_start_date: true } })
        if (!user) throw new Error('User tidak ditemukan')
        const weekStart = getWeekStart()
        const usage = user.week_start_date && new Date(user.week_start_date) >= weekStart ? user.weekly_usage_count : 0
        if (user.subscription_tier === 'FREE' && usage >= 3) throw new Error('Kuota mingguan generate tugas habis (maks 3/minggu). Upgrade ke Premium untuk akses unlimited.')

        const profile = await prisma.studentProfile.findUnique({ where: { user_id: session.user.id } })
        if (!profile) throw new Error('Profile tidak ditemukan. Silakan lengkapi profile di /settings')
        const config = lengthConfig(body.answer_length)
        const taskSession = await prisma.taskSession.create({
          data: {
            user_id: session.user.id, course_id: body.course_id, task_type: body.task_type, min_words_target: config.minWords,
            course_name_snapshot: body.course_name, module_book_title_snapshot: body.module_book_title, tutor_name_snapshot: body.tutor_name,
            task_description_snapshot: body.task_description || null, source_requirements: body.source_requirements || null, answer_style: body.answer_style,
            task_items: { create: body.questions.map((question_text, index) => ({ question_text, question_order: index + 1, status: 'GENERATING' })) },
          }, include: { task_items: { orderBy: { question_order: 'asc' } } },
        })
        taskSessionId = taskSession.id
        const items = taskSession.task_items.map((item) => ({ questionOrder: item.question_order || 0, status: 'GENERATING' as const }))
        emit('progress', { stage: 'searching', message: 'Mencari referensi sesuai kebutuhan sumber...', items })
        const query = `${body.course_name} ${body.module_book_title} ${body.questions.join(' ')} ${body.source_requirements || ''}`
        const [search, moduleMetadata] = await Promise.all([combinedSearch({ query, maxResults: 8 }), searchModuleMetadata(body.module_book_title, profile.university_name)])
        try {
          const providers = await getActiveProvidersOrdered()
          const primary = providers[0]
          if (primary) {
            emit('progress', { stage: 'preparing_ai', message: `Menghubungkan ke ${primary.name}...`, providerName: primary.name, items })
          }
        } catch {
          // Abaikan kegagalan pre-check; generate() melaporkan error sebenarnya
        }
        emit('progress', { stage: 'generating', message: `AI sedang menyusun jawaban untuk ${body.questions.length} soal...`, items })
        const prompts = buildBatchPrompt(body, profile, formatSearchResultsForPrompt(search.results), moduleMetadata)
        const generated = await generate({ ...prompts, maxTokens: Math.min(8192, config.maxTokens * body.questions.length), temperature: 0.4 })
        emit('progress', { stage: 'validating_answers', message: 'Memverifikasi dan menyimpan jawaban tiap soal...', providerName: generated.providerName, model: generated.model, items })
        let answers: BatchAnswer[] = []
        try { answers = parseBatchResponse(generated.text, body.questions.length) } catch (error) {
          const message = error instanceof Error ? error.message : 'Format respons AI tidak valid'
          await prisma.taskItem.updateMany({ where: { session_id: taskSession.id }, data: { status: 'FAILED' } })
          emit('progress', { stage: 'failed', message, providerName: generated.providerName, model: generated.model, items: items.map((item) => ({ ...item, status: 'FAILED', error: message })) })
          throw error
        }
        const statuses: Array<'COMPLETED' | 'FAILED'> = []
        for (const item of taskSession.task_items) {
          const answer = answers.find((value) => value.questionOrder === item.question_order)
          if (!answer) {
            await prisma.taskItem.update({ where: { id: item.id }, data: { status: 'FAILED' } })
            statuses.push('FAILED')
          } else {
            await prisma.taskItem.update({ where: { id: item.id }, data: { answer_text: answer.answer.trim(), references_used: answer.references?.length ? JSON.parse(JSON.stringify({ references: answer.references })) : undefined, status: 'COMPLETED' } })
            statuses.push('COMPLETED')
          }
          const completedItems = taskSession.task_items.map((taskItem, index) => ({ questionOrder: taskItem.question_order || 0, status: statuses[index] || 'GENERATING' }))
          emit('progress', { stage: 'saving', message: 'Menyimpan hasil per soal...', providerName: generated.providerName, model: generated.model, items: completedItems })
        }
        await prisma.taskSession.update({ where: { id: taskSession.id }, data: { ai_provider_name: generated.providerName || null, ai_provider_type: generated.providerType || null, ai_model: generated.model || null } })
        await prisma.$transaction([
          prisma.user.update({ where: { id: session.user.id }, data: { weekly_usage_count: { increment: 1 }, week_start_date: weekStart } }),
          prisma.dailyUsageLog.create({ data: { user_id: session.user.id, session_id: taskSession.id, llm_tokens_used: generated.usage?.totalTokens || 0, tavily_calls: search.tavilyResults, exa_calls: search.exaResults, ai_provider_name: generated.providerName || null, ai_provider_type: generated.providerType || null, date: new Date() } }),
        ])
        const saved = await prisma.taskItem.findMany({ where: { session_id: taskSession.id }, orderBy: { question_order: 'asc' } })
        const result = { sessionId: taskSession.id, answers: saved.map((item) => item.answer_text || ''), itemStatuses: saved.map((item) => item.status), references: [], providerName: generated.providerName, providerType: generated.providerType, model: generated.model }
        emit('progress', { stage: 'formatting', message: 'Menyusun format dokumen akhir...', providerName: generated.providerName, model: generated.model, items: saved.map((item) => ({ questionOrder: item.question_order || 0, status: item.status })) })
        emit('complete', { result })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal generate jawaban'
        if (taskSessionId) await prisma.taskItem.updateMany({ where: { session_id: taskSessionId, status: 'GENERATING' }, data: { status: 'FAILED' } })
        emit('error', { message })
      } finally { controller.close() }
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } })
}
