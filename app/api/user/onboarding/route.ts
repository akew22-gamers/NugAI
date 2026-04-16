import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { NextResponse } from "next/server"

const profileSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  studentId: z.string().min(1, "NIM wajib diisi"),
  university: z.string().min(1, "Nama universitas wajib diisi"),
  major: z.string().min(1, "Program studi wajib diisi"),
})

const courseSchema = z.object({
  courseName: z.string().min(1, "Nama mata kuliah wajib diisi"),
  courseCode: z.string().min(1, "Kode mata kuliah wajib diisi"),
})

const onboardingRequestBody = z.object({
  profile: profileSchema,
  course: courseSchema.nullable(),
})

export type OnboardingRequest = z.infer<typeof onboardingRequestBody>

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu" },
        { status: 401 }
      )
    }

    const userId = session.user.id as string
    const userRole = session.user.role as "ADMIN" | "USER"

    if (userRole !== "USER") {
      return NextResponse.json(
        { error: "Hanya pengguna yang dapat melengkapi onboarding" },
        { status: 401 }
      )
    }

    const jsonBody = await request.json().catch(() => null)

    if (!jsonBody) {
      return NextResponse.json(
        { error: "Data tidak valid" },
        { status: 400 }
      )
    }

    const parsedResult = onboardingRequestBody.safeParse(jsonBody)

    if (!parsedResult.success) {
      const issues = parsedResult.error.issues
      const errorMessage = issues.length > 0 ? issues[0].message : "Data tidak valid"
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    const { profile, course } = parsedResult.data

    const existingProfile = await prisma.studentProfile.findUnique({
      where: { user_id: userId },
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: "Profil sudah ada, Anda telah melengkapi onboarding sebelumnya" },
        { status: 400 }
      )
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.studentProfile.create({
          data: {
            user_id: userId,
            full_name: profile.fullName,
            nim: profile.studentId,
            university_name: profile.university,
            faculty: profile.major,
            study_program: profile.major,
            upbjj_branch: undefined,
            university_logo_url: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=500",
            default_min_words: 300,
            default_tone: "Bahasa Indonesia Baku Semi-Formal",
            pdf_font_url: undefined,
          },
        })

        if (course) {
          await tx.course.create({
            data: {
              user_id: userId,
              course_name: course.courseName,
              module_book_title: course.courseCode,
              tutor_name: "Tutor",
            },
          })
        }
      })

      return NextResponse.json({
        success: true,
        message: "Onboarding berhasil disimpan",
        redirectUrl: "/dashboard",
      })
    } catch (transactionError) {
      console.error("Database transaction failed:", transactionError)
      return NextResponse.json(
        { error: "Gagal menyimpan data onboarding. Silakan coba lagi." },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Onboarding API error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi nanti." },
      { status: 500 }
    )
  }
}
