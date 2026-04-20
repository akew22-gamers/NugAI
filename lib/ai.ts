import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { streamText, generateText, type LanguageModel } from 'ai'
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

/**
 * Create the appropriate language model based on provider type.
 * 
 * - DEEPSEEK: Uses @ai-sdk/deepseek (dedicated SDK with correct /chat/completions endpoint)
 * - OPENAI: Uses @ai-sdk/openai default (Responses API)
 * - Others (GROQ, TOGETHER, CUSTOM): Uses @ai-sdk/openai .chat() method 
 *   to target /chat/completions instead of /responses
 */
function createModelForProvider(providerConfig: {
  provider_type: string
  base_url: string
  api_key: string
  default_model: string
}): LanguageModel {
  if (providerConfig.provider_type === 'DEEPSEEK') {
    // Use the dedicated DeepSeek SDK — it uses the correct base URL 
    // (https://api.deepseek.com) and /chat/completions endpoint.
    // Strip /v1 suffix if present (legacy DB entries may have it)
    let deepseekBaseUrl = providerConfig.base_url || undefined
    if (deepseekBaseUrl?.endsWith('/v1')) {
      deepseekBaseUrl = deepseekBaseUrl.slice(0, -3)
    }
    const deepseekProvider = createDeepSeek({
      baseURL: deepseekBaseUrl,
      apiKey: providerConfig.api_key,
    })
    return deepseekProvider(providerConfig.default_model)
  }

  if (providerConfig.provider_type === 'OPENAI') {
    // OpenAI supports the Responses API, use the default provider()
    const openaiProvider = createOpenAI({
      baseURL: providerConfig.base_url,
      apiKey: providerConfig.api_key,
    })
    return openaiProvider(providerConfig.default_model)
  }

  // For GROQ, TOGETHER, CUSTOM, and other OpenAI-compatible providers:
  // Use .chat() to explicitly target /chat/completions endpoint
  // instead of the default /responses endpoint (which only OpenAI supports)
  const openaiCompatProvider = createOpenAI({
    baseURL: providerConfig.base_url,
    apiKey: providerConfig.api_key,
  })
  return openaiCompatProvider.chat(providerConfig.default_model)
}

export async function generate(options: StreamOptions): Promise<GenerationResult & { providerName?: string; providerType?: string; model?: string }> {
  try {
    const result = await executeWithFailover(
      async (providerConfig) => {
        const model = createModelForProvider(providerConfig)

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
      { retryDelay: 500 }
    )

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('AI generation error:', errorMessage)
    throw error
  }
}

export async function streamGenerate(options: StreamOptions) {
  const result = await executeWithFailover(
    async (providerConfig) => {
      const model = createModelForProvider(providerConfig)

      return streamText({
        model,
        system: options.systemPrompt,
        prompt: options.userPrompt,
        maxOutputTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
      })
    },
    { retryDelay: 500 }
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
