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

// GET /api/profile - Get current user profile
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get student profile
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
      return NextResponse.json(
        { error: "Profil tidak ditemukan. Silakan buat profil terlebih dahulu." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: profile,
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil profil." },
      { status: 500 }
    )
  }
}

// PATCH /api/profile - Update current user profile
export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()

    // Validate request body
    const validatedData = profileUpdateSchema.parse(body)

    // Verify profile exists for this user (ownership check)
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { user_id: userId },
    })

    if (!existingProfile) {
      return NextResponse.json(
        { error: "Profil tidak ditemukan. Silakan buat profil terlebih dahulu." },
        { status: 404 }
      )
    }

    // Update profile
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

    const updatedProfile = await prisma.studentProfile.update({
      where: { user_id: userId },
      data: updateData as any,
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

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: "Profil berhasil diperbarui.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = (error as any).issues as Array<{ path: Array<string | number>; message: string }>
      return NextResponse.json(
        { 
          error: "Validasi gagal.",
          details: (issues as any).map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui profil." },
      { status: 500 }
    )
  }
}
