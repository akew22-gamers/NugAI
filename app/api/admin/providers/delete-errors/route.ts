import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdminAuth() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

export async function POST() {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const errorProviders = await prisma.aIProvider.findMany({
      where: { health_status: 'error' },
      select: { id: true, provider_name: true },
    })

    if (errorProviders.length === 0) {
      return NextResponse.json({
        deleted: 0,
        message: 'Tidak ada provider berstatus error',
      })
    }

    const result = await prisma.aIProvider.deleteMany({
      where: { health_status: 'error' },
    })

    return NextResponse.json({
      deleted: result.count,
      providers: errorProviders,
      message: `Berhasil menghapus ${result.count} provider error`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete error providers'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
