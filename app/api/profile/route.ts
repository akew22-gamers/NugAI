import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const profileUpdateSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap wajib diisi"),
  nim: z.string().min(1, "NIM wajib diisi"),
  university_name: z.string().min(1, "Nama universitas wajib diisi"),
  faculty: z.string().min(1, "Fakultas wajib diisi"),
  study_program: z.string().min(1, "Program studi wajib diisi"),
  upbjj_branch: z.string().optional().nullable(),
  default_min_words: z.number().int().positive().optional(),
  default_tone: z.string().optional(),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId },
      select: {
        id: true,
        full_name: true,
        nim: true,
        university_name: true,
        faculty: true,
        study_program: true,
        upbjj_branch: true,
        default_min_words: true,
        default_tone: true,
        university_logo_url: true,
        pdf_font_url: true,
        created_at: true,
        updated_at: true,
      },
    })

    if (!profile) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "Profil belum dibuat",
      })
    }

    return NextResponse.json({
      success: true,
      data: profile,
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()

    const validatedData = profileUpdateSchema.parse(body)

    const existingProfile = await prisma.studentProfile.findUnique({
      where: { user_id: userId },
    })

    const updateData = {
      full_name: validatedData.full_name,
      nim: validatedData.nim,
      university_name: validatedData.university_name,
      faculty: validatedData.faculty,
      study_program: validatedData.study_program,
      upbjj_branch: validatedData.upbjj_branch ?? null,
      ...(validatedData.default_min_words !== undefined && { default_min_words: validatedData.default_min_words }),
      ...(validatedData.default_tone !== undefined && { default_tone: validatedData.default_tone }),
    }

    let updatedProfile

    if (!existingProfile) {
      updatedProfile = await prisma.studentProfile.create({
        data: {
          user_id: userId,
          ...updateData,
          university_logo_url: "",
        },
        select: {
          id: true,
          full_name: true,
          nim: true,
          university_name: true,
          faculty: true,
          study_program: true,
          upbjj_branch: true,
          default_min_words: true,
          default_tone: true,
          university_logo_url: true,
          pdf_font_url: true,
          updated_at: true,
        },
      })
    } else {
      updatedProfile = await prisma.studentProfile.update({
        where: { user_id: userId },
        data: updateData,
        select: {
          id: true,
          full_name: true,
          nim: true,
          university_name: true,
          faculty: true,
          study_program: true,
          upbjj_branch: true,
          default_min_words: true,
          default_tone: true,
          university_logo_url: true,
          pdf_font_url: true,
          updated_at: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: "Profil berhasil diperbarui",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues as Array<{ path: Array<string | number>; message: string }>
      return NextResponse.json(
        { 
          error: "Validasi gagal",
          details: issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}