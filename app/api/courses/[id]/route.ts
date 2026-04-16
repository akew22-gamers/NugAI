// @ts-nocheck
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

const updateCourseSchema = z.object({
  course_name: z.string().min(3).optional(),
  module_book_title: z.string().min(3).optional(),
  tutor_name: z.string().min(3).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Tidak terautentikasi. Silakan login." },
        { status: 401 }
      )
    }

    const { id } = await params

    const body = await request.json()
    const validationResult = updateCourseSchema.safeParse(body)

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues.at(0)
      return NextResponse.json(
        { error: firstIssue?.message || "Validasi gagal" },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    const existingCourse = await prisma.course.findUnique({
      where: { id },
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Mata kuliah tidak ditemukan" },
        { status: 404 }
      )
    }

    if (existingCourse.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Tidak memiliki izin untuk mengubah mata kuliah ini" },
        { status: 403 }
      )
    }

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      course,
    })
  } catch (error) {
    console.error("[PATCH /api/courses/:id] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui mata kuliah." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Tidak terautentikasi. Silakan login." },
        { status: 401 }
      )
    }

    const { id } = await params

    const existingCourse = await prisma.course.findUnique({
      where: { id },
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Mata kuliah tidak ditemukan" },
        { status: 404 }
      )
    }

    if (existingCourse.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Tidak memiliki izin untuk menghapus mata kuliah ini" },
        { status: 403 }
      )
    }

    await prisma.$transaction(async (tx) => {
      const taskSessions = await tx.taskSession.findMany({
        where: { course_id: id },
      })

      const updatePromises = taskSessions.map((session) =>
        tx.taskSession.update({
          where: { id: session.id },
          data: {
            course_name_snapshot: existingCourse.course_name,
            module_book_title_snapshot: existingCourse.module_book_title,
            tutor_name_snapshot: existingCourse.tutor_name,
            course_id: null,
          },
        })
      )

      await Promise.all(updatePromises)

      await tx.course.delete({
        where: { id },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/courses/:id] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus mata kuliah." },
      { status: 500 }
    )
  }
}
