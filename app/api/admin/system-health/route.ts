import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveAIProvider } from '@/lib/provider'
import { prisma as prismaClient } from '@/lib/prisma'

async function checkAdminAuth() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

async function isSearchProviderActive(providerType: 'TAVILY' | 'EXA'): Promise<boolean> {
  const provider = await prismaClient.searchProvider.findUnique({
    where: { provider_type: providerType },
    select: { is_active: true },
  })
  return provider?.is_active ?? false
}

export async function GET() {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const activeProvider = await getActiveAIProvider()
    
    const tavilyConfigured = await isSearchProviderActive('TAVILY')
    const exaConfigured = await isSearchProviderActive('EXA')

    let aiStatus: 'healthy' | 'warning' | 'error' = 'warning'
    let aiMessage = 'Menunggu konfigurasi'

    if (activeProvider) {
      try {
        const response = await fetch(`${activeProvider.base_url}/models`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer test`,
          },
        })
        
        if (response.ok || response.status === 401) {
          aiStatus = 'healthy'
          aiMessage = activeProvider.provider_name
        } else {
          aiStatus = 'error'
          aiMessage = `Error: ${response.status}`
        }
      } catch {
        aiStatus = 'error'
        aiMessage = 'Connection failed'
      }
    }

    const systems = [
      {
        name: 'AI Provider',
        status: aiStatus,
        message: aiMessage,
      },
      {
        name: 'Tavily Search',
        status: tavilyConfigured ? 'healthy' : 'warning',
        message: tavilyConfigured ? 'Aktif' : 'Menunggu konfigurasi',
      },
      {
        name: 'Exa Search',
        status: exaConfigured ? 'healthy' : 'warning',
        message: exaConfigured ? 'Aktif' : 'Menunggu konfigurasi',
      },
      {
        name: 'Database',
        status: 'healthy',
        message: 'Sehat',
      },
    ]

    return NextResponse.json({ systems })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check system health' },
      { status: 500 }
    )
  }
}