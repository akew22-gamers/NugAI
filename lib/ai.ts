import { createOpenAI } from '@ai-sdk/openai'
import { streamText, generateText } from 'ai'
import { executeWithFailover, getActiveProvidersOrdered } from '@/lib/ai-failover'

export interface StreamOptions {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
}

export interface GenerationResult {
  text: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

async function createProviderClient(config: {
  baseURL: string
  apiKey: string
  model: string
}) {
  const provider = createOpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  })
  return provider(config.model)
}

export async function getAIModel() {
  const providerData = await getActiveProvidersOrdered()
  
  if (providerData.length === 0) {
    throw new Error('No active AI provider configured')
  }

  const primaryProvider = providerData[0]
  
  const { getActiveProviderWithKey } = await import('./provider')
  const activeProvider = await getActiveProviderWithKey()
  
  if (!activeProvider) {
    throw new Error('Primary provider not found')
  }

  const model = createOpenAI({
    baseURL: activeProvider.config.base_url,
    apiKey: activeProvider.decryptedKey,
  })

  return model(activeProvider.config.default_model)
}

export async function generate(options: StreamOptions): Promise<GenerationResult> {
  const result = await executeWithFailover(
    async (providerConfig) => {
      const model = await createProviderClient({
        baseURL: providerConfig.base_url,
        apiKey: providerConfig.api_key,
        model: providerConfig.default_model,
      })

      const generationResult = await generateText({
        model,
        system: options.systemPrompt,
        prompt: options.userPrompt,
        maxOutputTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
      })

      return {
        text: generationResult.text,
        usage: generationResult.usage ? {
          inputTokens: generationResult.usage.inputTokens ?? 0,
          outputTokens: generationResult.usage.outputTokens ?? 0,
          totalTokens: (generationResult.usage.inputTokens ?? 0) + (generationResult.usage.outputTokens ?? 0),
        } : undefined,
      }
    },
    { retryDelay: 1000 }
  )

  return result
}

export async function streamGenerate(options: StreamOptions) {
  const result = await executeWithFailover(
    async (providerConfig) => {
      const modelProvider = createOpenAI({
        baseURL: providerConfig.base_url,
        apiKey: providerConfig.api_key,
      })
      const model = modelProvider(providerConfig.default_model)

      return streamText({
        model,
        system: options.systemPrompt,
        prompt: options.userPrompt,
        maxOutputTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
      })
    },
    { retryDelay: 1000 }
  )

  return result
}

export async function getProviderInfo() {
  const providers = await getActiveProvidersOrdered()
  
  if (providers.length === 0) {
    throw new Error('No active AI provider configured')
  }

  const primaryProvider = providers[0]
  
  return {
    providerName: primaryProvider.name,
    providerType: primaryProvider.type,
    model: 'Primary provider',
    availableProviders: providers.map(p => ({
      name: p.name,
      type: p.type,
      isPrimary: p.isPrimary,
    })),
  }
}

export function isProviderConfigured(): Promise<boolean> {
  return getActiveProvidersOrdered()
    .then((providers) => providers.length > 0)
    .catch(() => false)
}
