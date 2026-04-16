import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptApiKey, encryptApiKey } from '@/lib/encryption'
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

    if (!provider_id) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }

    let baseUrl = base_url
    let apiKey = api_key

    if (!baseUrl || !apiKey) {
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
    }

    const models = await fetchModelsFromProvider(baseUrl, apiKey)

    if (provider_id) {
      await updateProviderModels(provider_id, models)
    }

    return NextResponse.json({ models })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch models'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}