import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"

const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Kata sandi saat ini wajib diisi"),
  new_password: z.string().min(6, "Kata sandi baru minimal 6 karakter"),
})

export async function POST(request: Request) {
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

    const validatedData = changePasswordSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan." },
        { status: 404 }
      )
    }

    const isPasswordValid = await bcrypt.compare(
      validatedData.current_password,
      user.password
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Kata sandi saat ini tidak sesuai." },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(validatedData.new_password, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      success: true,
      message: "Kata sandi berhasil diubah.",
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

    console.error("Error changing password:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengubah kata sandi." },
      { status: 500 }
    )
  }
}
