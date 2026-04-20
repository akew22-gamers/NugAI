import { prisma } from '@/lib/prisma'
import { decryptApiKey } from './encryption'

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
  const { maxRetries = 3, retryDelay = 1000 } = options

  const providers = await prisma.aIProvider.findMany({
    where: { is_active: true },
    orderBy: { created_at: 'asc' },
  })

  if (providers.length === 0) {
    throw new Error('No active AI provider configured')
  }

  const errors: Error[] = []

  for (const provider of providers) {
    try {
      console.log(`Attempting provider: ${provider.provider_name} (${provider.provider_type})`)
      console.log(`Base URL: ${provider.base_url}`)
      console.log(`Model: ${provider.default_model}`)
      console.log(`Active: ${provider.is_active}`)
      
      const decryptedKey = decryptApiKey(provider.api_key)

      if (!provider.base_url || !provider.default_model || !decryptedKey) {
        const errorMsg = `Provider ${provider.provider_name} missing required configuration`
        console.error(errorMsg)
        errors.push(new Error(errorMsg))
        continue
      }

      console.log(`Provider ${provider.provider_name} config valid, attempting generation...`)

      const providerConfig = {
        provider_id: provider.id,
        provider_name: provider.provider_name,
        provider_type: provider.provider_type,
        base_url: provider.base_url,
        api_key: decryptedKey,
        default_model: provider.default_model,
      }

      const result = await operation(providerConfig)

      console.log(`✅ Provider ${provider.provider_name} succeeded!`)

      return {
        ...(result as any),
        providerName: provider.provider_name,
        providerType: provider.provider_type,
        model: provider.default_model,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(
        `❌ Provider ${provider.provider_name} (${provider.provider_type}) failed: ${errorMessage}`
      )
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      errors.push(error instanceof Error ? error : new Error(errorMessage))

      if (providers.indexOf(provider) < providers.length - 1) {
        console.log(`Trying next provider in ${retryDelay}ms...`)
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay)
        )
      }
    }
  }

  const allErrors = errors.map((e) => e.message).join(', ')
  console.error(`All ${providers.length} providers failed: ${allErrors}`)
  throw new Error(
    `All ${providers.length} providers failed. Errors: ${allErrors}`
  )
}

export async function getActiveProvidersOrdered(): Promise<
  Array<{
    id: string
    name: string
    type: string
    isPrimary: boolean
  }>
> {
  const providers = await prisma.aIProvider.findMany({
    where: { is_active: true },
    orderBy: { created_at: 'asc' },
  })

  return providers.map((p, index) => ({
    id: p.id,
    name: p.provider_name,
    type: p.provider_type,
    isPrimary: index === 0,
  }))
}
