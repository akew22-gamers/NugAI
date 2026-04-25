import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      )
    }

    const userTasks = await prisma.taskSession.findMany({
      where: { user_id: session.user.id },
      select: { id: true },
    })

    const taskIds = userTasks.map((t) => t.id)

    if (taskIds.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 })
    }

    await prisma.taskItem.deleteMany({
      where: { session_id: { in: taskIds } },
    })

    await prisma.dailyUsageLog.deleteMany({
      where: { session_id: { in: taskIds } },
    })

    const result = await prisma.taskSession.deleteMany({
      where: { user_id: session.user.id },
    })

    return NextResponse.json({ success: true, deleted: result.count })
  } catch (error) {
    console.error("Error deleting all tasks:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus semua tugas." },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) : 10

    const tasks = await prisma.taskSession.findMany({
      where: {
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
        ai_provider_name: true,
        ai_model: true,
        _count: {
          select: {
            task_items: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: limit,
    })

    return NextResponse.json({
      tasks: tasks.map((task) => ({
        id: task.id,
        task_type: task.task_type,
        min_words_target: task.min_words_target,
        created_at: task.created_at,
        course_name: task.course_name_snapshot,
        module_book_title: task.module_book_title_snapshot,
        tutor_name: task.tutor_name_snapshot,
        ai_provider_name: task.ai_provider_name,
        ai_model: task.ai_model,
        items_count: task._count.task_items,
      })),
    })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data tugas." },
      { status: 500 }
    )
  }
}