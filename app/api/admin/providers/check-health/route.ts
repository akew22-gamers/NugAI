import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptApiKey } from '@/lib/encryption'

async function checkAdminAuth() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

interface CheckResult {
  id: string
  provider_name: string
  status: 'normal' | 'error'
  error?: string
}

async function checkProviderHealth(
  baseUrl: string,
  apiKey: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      let detail = ''
      try {
        const text = await response.text()
        detail = text.slice(0, 200)
      } catch {
        // ignore
      }
      return {
        ok: false,
        error: `HTTP ${response.status} ${response.statusText}${detail ? `: ${detail}` : ''}`,
      }
    }

    const data = await response.json()
    if (!data?.data || !Array.isArray(data.data)) {
      return { ok: false, error: 'Invalid response format from provider' }
    }

    return { ok: true }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { ok: false, error: 'Request timeout (>15s)' }
      }
      return { ok: false, error: error.message }
    }
    return { ok: false, error: 'Unknown error' }
  }
}

export async function POST() {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const providers = await prisma.aIProvider.findMany({
      select: {
        id: true,
        provider_name: true,
        base_url: true,
        api_key: true,
      },
    })

    const now = new Date()

    const results: CheckResult[] = await Promise.all(
      providers.map(async (p) => {
        let apiKey: string
        try {
          apiKey = decryptApiKey(p.api_key)
        } catch {
          return {
            id: p.id,
            provider_name: p.provider_name,
            status: 'error' as const,
            error: 'Failed to decrypt API key',
          }
        }

        const result = await checkProviderHealth(p.base_url, apiKey)
        if (result.ok) {
          return {
            id: p.id,
            provider_name: p.provider_name,
            status: 'normal' as const,
          }
        }
        return {
          id: p.id,
          provider_name: p.provider_name,
          status: 'error' as const,
          error: result.error,
        }
      })
    )

    await Promise.all(
      results.map((r) =>
        prisma.aIProvider.update({
          where: { id: r.id },
          data: {
            health_status: r.status,
            health_error: r.status === 'error' ? (r.error?.slice(0, 500) ?? null) : null,
            last_health_check: now,
          },
        })
      )
    )

    const normalCount = results.filter((r) => r.status === 'normal').length
    const errorCount = results.filter((r) => r.status === 'error').length

    return NextResponse.json({
      checked_at: now.toISOString(),
      total: results.length,
      normal: normalCount,
      error: errorCount,
      results,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check providers'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
