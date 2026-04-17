import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptApiKey } from '@/lib/encryption'
import { fetchModelsFromProvider, updateProviderModels } from '@/lib/provider'

async function checkAdminAuth() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

export async function POST(request: NextRequest) {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { provider_id, base_url, api_key } = body

    // Provider ID is optional when base_url and api_key are provided (for new provider setup)
    let baseUrl = base_url
    let apiKey = api_key

    // If base_url and api_key are provided directly, use them (for new provider setup)
    if (baseUrl && apiKey) {
      const models = await fetchModelsFromProvider(baseUrl, apiKey)

      // Only update database if provider_id exists (editing existing provider)
      if (provider_id) {
        await updateProviderModels(provider_id, models)
      }

      return NextResponse.json({ models })
    }

    // If base_url or api_key not provided, need provider_id to fetch from database
    if (!provider_id) {
      return NextResponse.json(
        { error: 'Provider ID is required when base_url and api_key are not provided' },
        { status: 400 }
      )
    }

    const provider = await prisma.aIProvider.findUnique({
      where: { id: provider_id },
      select: { base_url: true, api_key: true },
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    baseUrl = provider.base_url
    apiKey = decryptApiKey(provider.api_key)

    const models = await fetchModelsFromProvider(baseUrl, apiKey)
    await updateProviderModels(provider_id, models)

    return NextResponse.json({ models })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch models'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}