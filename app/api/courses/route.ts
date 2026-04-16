// @ts-nocheck
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createCourseSchema = z.object({
  course_name: z.string().min(3, "Nama mata kuliah minimal 3 karakter"),
  module_book_title: z.string().min(3, "Judul modul/buku minimal 3 karakter"),
  tutor_name: z.string().min(3, "Nama tutor minimal 3 karakter"),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Tidak terautentikasi. Silakan login." },
        { status: 401 }
      )
    }

    const courses = await prisma.course.findMany({
      where: {
        user_id: session.user.id,
      },
      orderBy: {
        created_at: "desc",
      },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("[GET /api/courses] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data mata kuliah." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Tidak terautentikasi. Silakan login." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = createCourseSchema.safeParse(body)

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues.at(0)
      return NextResponse.json(
        { error: firstIssue?.message || "Validasi gagal" },
        { status: 400 }
      )
    }

    const { course_name, module_book_title, tutor_name } = validationResult.data

    const course = await prisma.course.create({
      data: {
        course_name,
        module_book_title,
        tutor_name,
        user_id: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      course,
    })
  } catch (error) {
    console.error("[POST /api/courses] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat mata kuliah." },
      { status: 500 }
    )
  }
}
