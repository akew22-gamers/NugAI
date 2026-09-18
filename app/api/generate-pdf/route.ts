import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generatePDF, PDFData } from '@/lib/pdf/generator'

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "task_sessions" ADD COLUMN IF NOT EXISTS "source_requirements" TEXT`)
      await prisma.$executeRawUnsafe(`ALTER TABLE "task_items" ADD COLUMN IF NOT EXISTS "question_order" INTEGER`)
    } catch {
      // ignore
    }
    const body = await request.json()
    const { sessionId, taskType, taskDescription, withCover, sessionNumber, includeDescription, fontFamily } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let taskSession: any = null
    try {
      taskSession = await prisma.taskSession.findUnique({
        where: { id: sessionId },
        include: {
          task_items: { orderBy: [{ question_order: 'asc' }, { created_at: 'asc' }] },
          course: true,
          user: {
            include: {
              student_profile: true,
            },
          },
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes("question_order") || message.includes("source_requirements")) {
        const fallback: any = await prisma.taskSession.findUnique({
          where: { id: sessionId },
          include: { task_items: { orderBy: { created_at: 'asc' } }, course: true, user: { include: { student_profile: true } } },
        })
        if (fallback) {
          fallback.task_items = fallback.task_items.map((item: { question_order?: number }, index: number) => ({ ...item, question_order: index + 1 }))
        }
        taskSession = fallback
      } else {
        throw error
      }
    }

    if (!taskSession) {
      return NextResponse.json(
        { error: 'Task session not found' },
        { status: 404 }
      )
    }

    if (taskSession.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to this session' },
        { status: 403 }
      )
    }

    if (!taskSession.user.student_profile) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      )
    }

    const profile = taskSession.user.student_profile

    const pdfData: PDFData = {
      taskType: taskSession.task_type,
      courseName: taskSession.course_name_snapshot || 'Unknown Course',
      courseCode: taskSession.course_code_snapshot || taskSession.course?.course_code || undefined,
      moduleName: taskSession.module_book_title_snapshot || 'Unknown Module',
      tutorName: taskSession.tutor_name_snapshot || 'Unknown Tutor',
      studentName: profile.full_name,
      studentNim: profile.nim,
      universityName: profile.university_name,
      faculty: profile.faculty,
      studyProgram: profile.study_program,
      upbjjBranch: profile.upbjj_branch || undefined,
      universityLogoUrl: profile.university_logo_url,
      taskItems: taskSession.task_items.map((item: { question_text: string; answer_text: string | null; references_used: unknown }) => ({
        question_text: item.question_text,
        answer_text: item.answer_text || '',
        references_used: (item.references_used as unknown as PDFData['taskItems'][0]['references_used']) || undefined,
      })),
      taskDescription: taskSession.task_description_snapshot || taskDescription || undefined,
      includeDescription: includeDescription !== false,
      createdAt: taskSession.created_at,
      withCover: withCover || false,
      sessionNumber: sessionNumber || undefined,
      fontFamily: fontFamily || 'Times-Roman',
    }

    const pdfBuffer = await generatePDF(pdfData)

    const filename = `Tugas-${pdfData.courseName.replace(/\s+/g, '-')}-${pdfData.studentNim}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('PDF generation failed:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `PDF generation failed: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate PDF due to unknown error' },
      { status: 500 }
    )
  }
}
