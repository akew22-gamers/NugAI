import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

async function ensureColumnsForTasksRoute(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "task_sessions" ADD COLUMN IF NOT EXISTS "source_requirements" TEXT`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "task_items" ADD COLUMN IF NOT EXISTS "question_order" INTEGER`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "task_items_session_id_question_order_idx" ON "task_items"("session_id", "question_order")`)
  } catch {
    // ignore - fallback query will handle missing columns
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      )
    }

    await ensureColumnsForTasksRoute()

    let task
    try {
      task = await prisma.taskSession.findUnique({
        where: {
          id: id,
          user_id: session.user.id,
        },
        select: {
          id: true,
          task_type: true,
          min_words_target: true,
          created_at: true,
          course_name_snapshot: true,
          module_book_title_snapshot: true,
          tutor_name_snapshot: true,
          task_description_snapshot: true,
          source_requirements: true,
          ai_provider_name: true,
          ai_provider_type: true,
          ai_model: true,
          task_items: {
            select: {
              id: true,
              question_text: true,
              answer_text: true,
              references_used: true,
              status: true,
              question_order: true,
              created_at: true,
            },
            orderBy: [{ question_order: "asc" }, { created_at: "asc" }],
          },
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes("source_requirements") || message.includes("question_order")) {
        task = await prisma.taskSession.findUnique({
          where: { id, user_id: session.user.id },
          select: {
            id: true, task_type: true, min_words_target: true, created_at: true,
            course_name_snapshot: true, module_book_title_snapshot: true, tutor_name_snapshot: true, task_description_snapshot: true,
            ai_provider_name: true, ai_provider_type: true, ai_model: true,
            task_items: { select: { id: true, question_text: true, answer_text: true, references_used: true, status: true, created_at: true }, orderBy: { created_at: "asc" } },
          },
        }) as typeof task
        if (task) {
          ;(task as unknown as { source_requirements: null }).source_requirements = null
          task.task_items = (task.task_items as unknown as Array<Record<string, unknown>>).map((item, index) => ({ ...item, question_order: index + 1 })) as typeof task.task_items
        }
      } else {
        throw error
      }
    }

    if (!task) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data tugas." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      )
    }

    const task = await prisma.taskSession.findUnique({
      where: {
        id: id,
        user_id: session.user.id,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan" },
        { status: 404 }
      )
    }

    await prisma.taskItem.deleteMany({
      where: {
        session_id: id,
      },
    })

    await prisma.dailyUsageLog.deleteMany({
      where: {
        session_id: id,
      },
    })

    await prisma.taskSession.delete({
      where: {
        id: id,
      },
    })

    return NextResponse.json({ success: true, message: "Tugas berhasil dihapus" })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus tugas." },
      { status: 500 }
    )
  }
}
