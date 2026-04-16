import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'
import { SearchProviderType } from '@prisma/client'

async function checkAdminAuth() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

export async function GET() {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const providers = await prisma.searchProvider.findMany({
      select: {
        id: true,
        provider_type: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { provider_type: 'asc' },
    })

    return NextResponse.json({ providers })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch search providers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { provider_type, api_key, is_active } = body

    if (!provider_type || !api_key) {
      return NextResponse.json(
        { error: 'Provider type and API key are required' },
        { status: 400 }
      )
    }

    if (!Object.values(SearchProviderType).includes(provider_type)) {
      return NextResponse.json(
        { error: 'Invalid provider type' },
        { status: 400 }
      )
    }

    const encryptedKey = encryptApiKey(api_key)

    const provider = await prisma.searchProvider.upsert({
      where: { provider_type },
      create: {
        provider_type,
        api_key: encryptedKey,
        is_active: is_active ?? true,
      },
      update: {
        api_key: encryptedKey,
        is_active: is_active ?? true,
      },
    })

    return NextResponse.json({
      provider: {
        id: provider.id,
        provider_type: provider.provider_type,
        is_active: provider.is_active,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to configure search provider'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, is_active } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }

    const provider = await prisma.searchProvider.update({
      where: { id },
      data: { is_active },
    })

    return NextResponse.json({
      provider: {
        id: provider.id,
        provider_type: provider.provider_type,
        is_active: provider.is_active,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update search provider'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}