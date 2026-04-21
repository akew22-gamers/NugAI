import { prisma } from '@/lib/prisma'
import { decryptApiKey } from './encryption'

// Health tracking at module scope
const providerHealthMap = new Map<string, { lastFailure: number; consecutiveFailures: number }>()
const HEALTH_COOLDOWN_MS = 60_000 // skip provider yang gagal < 60 detik lalu

function isProviderHealthy(providerId: string): boolean {
  const health = providerHealthMap.get(providerId)
  if (!health) return true
  if (health.consecutiveFailures >= 3 && Date.now() - health.lastFailure < HEALTH_COOLDOWN_MS) {
    return false
  }
  return true
}

function recordFailure(providerId: string) {
  const health = providerHealthMap.get(providerId) || { lastFailure: 0, consecutiveFailures: 0 }
  health.lastFailure = Date.now()
  health.consecutiveFailures += 1
  providerHealthMap.set(providerId, health)
}

function recordSuccess(providerId: string) {
  providerHealthMap.delete(providerId)
}

export interface FailoverConfig {
  maxRetries?: number
  retryDelay?: number
}

export interface ProviderResult {
  text: string
  providerName: string
  providerType: string
  model: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

export async function executeWithFailover<T>(
  operation: (providerConfig: {
    provider_id: string
    provider_name: string
    provider_type: string
    base_url: string
    api_key: string
    default_model: string
  }) => Promise<T>,
  options: FailoverConfig = {}
): Promise<T & ProviderResult> {
  const { maxRetries = 3, retryDelay = 500 } = options

  const now = new Date().toISOString()
  console.log(`[AI Failover] === ${now} ===`)
  
  const providers = await prisma.aIProvider.findMany({
    where: { is_active: true },
    select: {
      id: true,
      provider_name: true,
      provider_type: true,
      base_url: true,
      default_model: true,
      api_key: true,
      is_active: true,
      priority: true,
    },
    orderBy: [{ priority: 'desc' }, { created_at: 'asc' }],
  })

  console.log(`[AI Failover] Found ${providers.length} active provider(s):`)
  providers.forEach((p, idx) => {
    console.log(`  [${idx + 1}] ${p.provider_name} (${p.provider_type}) - Priority: ${p.priority} - ID: ${p.id} - Active: ${p.is_active}`)
    console.log(`      Model: ${p.default_model}`)
  })

  if (providers.length === 0) {
    const errorMsg = 'No active AI provider configured. Please activate a provider in Admin panel.'
    console.error(`[AI Failover] ❌ ${errorMsg}`)
    throw new Error(errorMsg)
  }

  // Check if all providers are unhealthy, if so, reset health map
  const healthyProviders = providers.filter(p => isProviderHealthy(p.id))
  if (healthyProviders.length === 0 && providers.length > 0) {
    console.log(`[AI Failover] ⚠️ All providers are unhealthy. Resetting health status.`)
    providerHealthMap.clear()
  }

  const errorNames: string[] = []

  for (const provider of providers) {
    if (!isProviderHealthy(provider.id)) {
      console.log(`[AI Failover] ⏭️ Skipping unhealthy provider: ${provider.provider_name} (${provider.provider_type})`)
      continue
    }

    try {
      let modelToUse = provider.default_model
      
      if (provider.provider_type === 'DEEPSEEK') {
        modelToUse = modelToUse || 'deepseek-chat'
        if (modelToUse !== provider.default_model) {
          console.log(`[AI Failover] 🔧 Using DeepSeek fallback model: ${modelToUse}`)
        }
      } else if (provider.provider_type === 'OPENAI') {
        modelToUse = modelToUse || 'gpt-4o-mini'
      } else if (provider.provider_type === 'GROQ') {
        modelToUse = modelToUse || 'llama-3.3-70b-versatile'
      }

      console.log(`[AI Failover] ➡️  Attempting: ${provider.provider_name} (${provider.provider_type}) [ID: ${provider.id}]`)
      console.log(`[AI Failover] Base URL: ${provider.base_url}`)
      console.log(`[AI Failover] Using Model: ${modelToUse}`)
      
      const decryptedKey = decryptApiKey(provider.api_key)
      console.log(`[AI Failover] API Key length: ${decryptedKey.length} chars`)

      if (!provider.base_url || !modelToUse || !decryptedKey) {
        const errorMsg = `Provider ${provider.provider_name} missing required configuration`
        console.error(`[AI Failover] ❌ ${errorMsg}`)
        errorNames.push(`${provider.provider_name}: missing config`)
        continue
      }

      const providerConfig = {
        provider_id: provider.id,
        provider_name: provider.provider_name,
        provider_type: provider.provider_type,
        base_url: provider.base_url,
        api_key: decryptedKey,
        default_model: modelToUse,
      }

      const result = await operation(providerConfig)

      recordSuccess(provider.id)

      console.log(`[AI Failover] ✅ SUCCESS with ${provider.provider_name} (${provider.provider_type}) using model: ${modelToUse}`)
      console.log(`[AI Failover] === End of Request ===`)

      return {
        ...(result as any),
        providerName: provider.provider_name,
        providerType: provider.provider_type,
        model: modelToUse,
      }
    } catch (error) {
      recordFailure(provider.id)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[AI Failover] ❌ ${provider.provider_name} failed: ${errorMessage}`)
      if (error instanceof Error) {
        console.error(`[AI Failover] Stack: ${error.stack}`)
      }
      errorNames.push(`${provider.provider_name}: ${errorMessage}`)
    }
  }

  const allErrors = errorNames.join(', ')
  console.error(`[AI Failover] ❌ All providers failed: ${allErrors}`)
  console.error(`[AI Failover] === End of Request ===`)
  throw new Error(
    `All ${providers.length} providers failed: ${allErrors}`
  )
}

export async function getActiveProvidersOrdered(): Promise<
  Array<{
    id: string
    name: string
    type: string
    priority: number
    isPrimary: boolean
  }>
> {
  const providers = await prisma.aIProvider.findMany({
    where: { is_active: true },
    orderBy: [{ priority: 'desc' }, { created_at: 'asc' }],
  })

  return providers.map((p, index) => ({
    id: p.id,
    name: p.provider_name,
    type: p.provider_type,
    priority: p.priority,
    isPrimary: index === 0,
  }))
}
