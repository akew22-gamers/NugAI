import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getAllAIProviders,
  createAIProvider,
  updateAIProvider,
  deleteAIProvider,
  setActiveProvider,
  CreateAIProviderInput,
  UpdateAIProviderInput,
} from '@/lib/provider'
import { AIProviderType } from '@prisma/client'

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
    const providers = await getAllAIProviders()
    return NextResponse.json({ providers })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
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
    const { provider_type, provider_name, base_url, api_key, default_model, priority } = body

    if (!provider_type || !api_key) {
      return NextResponse.json(
        { error: 'Provider type and API key are required' },
        { status: 400 }
      )
    }

    if (!Object.values(AIProviderType).includes(provider_type)) {
      return NextResponse.json(
        { error: 'Invalid provider type' },
        { status: 400 }
      )
    }

    if (provider_type === 'CUSTOM' && !base_url) {
      return NextResponse.json(
        { error: 'Base URL is required for custom provider' },
        { status: 400 }
      )
    }

    const input: CreateAIProviderInput = {
      provider_type,
      provider_name: provider_name || '',
      base_url: base_url || '',
      api_key,
      default_model,
      priority: typeof priority === 'number' ? priority : parseInt(priority) || 0,
    }

    const provider = await createAIProvider(input)
    return NextResponse.json({ provider }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create provider'
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
    const { id, is_active, priority, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }

    if (is_active === false) {
      const allProviders = await getAllAIProviders()
      const activeProviders = allProviders.filter(p => p.is_active)
      const activeProvidersWithoutCurrent = activeProviders.filter(p => p.id !== id)
      
      if (is_active === false && activeProvidersWithoutCurrent.length === 0) {
        return NextResponse.json(
          { error: 'Minimal harus ada 1 provider aktif' },
          { status: 400 }
        )
      }
    }

    const input: UpdateAIProviderInput = { 
      is_active, 
      ...(priority !== undefined && { priority: typeof priority === 'number' ? priority : parseInt(priority) || 0 }),
      ...updates 
    }
    const provider = await updateAIProvider(id, input)
    return NextResponse.json({ provider })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update provider'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }

    await deleteAIProvider(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete provider'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }

    await setActiveProvider(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set active provider'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}