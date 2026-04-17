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
    const body = await request.json()
    const { sessionId, taskType } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const taskSession = await prisma.taskSession.findUnique({
      where: { id: sessionId },
      include: {
        task_items: true,
        user: {
          include: {
            student_profile: true,
          },
        },
      },
    })

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
      moduleName: taskSession.module_book_title_snapshot || 'Unknown Module',
      tutorName: taskSession.tutor_name_snapshot || 'Unknown Tutor',
      studentName: profile.full_name,
      studentNim: profile.nim,
      universityName: profile.university_name,
      faculty: profile.faculty,
      studyProgram: profile.study_program,
      upbjjBranch: profile.upbjj_branch || undefined,
      universityLogoUrl: profile.university_logo_url,
      taskItems: taskSession.task_items.map((item) => ({
        question_text: item.question_text,
        answer_text: item.answer_text || '',
        references_used: (item.references_used as unknown as PDFData['taskItems'][0]['references_used']) || undefined,
      })),
      createdAt: taskSession.created_at,
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
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}