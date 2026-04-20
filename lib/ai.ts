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

// Models that do NOT support temperature parameter
const MODELS_WITHOUT_TEMPERATURE = ['deepseek-reasoner', 'deepseek-r1']

// DeepSeek reasoning models — too slow for task generation, redirect to chat
const DEEPSEEK_REASONING_MODELS = ['deepseek-reasoner', 'deepseek-r1']

/**
 * Create the appropriate language model + generation options based on provider type.
 *
 * - DEEPSEEK: Uses @ai-sdk/deepseek. Auto-redirects reasoning models (deepseek-reasoner)
 *   to deepseek-chat since reasoner is far too slow for task generation and doesn't
 *   support temperature.
 * - OPENAI: Uses @ai-sdk/openai default (Responses API)
 * - Others (GROQ, TOGETHER, CUSTOM): Uses @ai-sdk/openai .chat()
 */
function createModelForProvider(providerConfig: {
  provider_type: string
  base_url: string
  api_key: string
  default_model: string
}): { model: LanguageModel; supportsTemperature: boolean } {
  if (providerConfig.provider_type === 'DEEPSEEK') {
    let deepseekBaseUrl = providerConfig.base_url || undefined
    if (deepseekBaseUrl?.endsWith('/v1')) {
      deepseekBaseUrl = deepseekBaseUrl.slice(0, -3)
    }

    // Redirect reasoning model to deepseek-chat — reasoner is for complex
    // multi-step reasoning tasks, not for this use case. It takes 60-180s
    // per request and doesn't support temperature, causing errors.
    let modelId = providerConfig.default_model
    if (DEEPSEEK_REASONING_MODELS.includes(modelId)) {
      console.warn(
        `[AI] ⚠️  DeepSeek model "${modelId}" is a reasoning model (slow, no temperature support). ` +
        `Auto-switching to "deepseek-chat" for task generation.`
      )
      modelId = 'deepseek-chat'
    }

    const deepseekProvider = createDeepSeek({
      baseURL: deepseekBaseUrl,
      apiKey: providerConfig.api_key,
    })
    const supportsTemperature = !MODELS_WITHOUT_TEMPERATURE.includes(modelId)
    return { model: deepseekProvider(modelId), supportsTemperature }
  }

  if (providerConfig.provider_type === 'OPENAI') {
    const openaiProvider = createOpenAI({
      baseURL: providerConfig.base_url,
      apiKey: providerConfig.api_key,
    })
    return { model: openaiProvider(providerConfig.default_model), supportsTemperature: true }
  }

  // GROQ, TOGETHER, CUSTOM — use .chat() for /chat/completions endpoint
  const openaiCompatProvider = createOpenAI({
    baseURL: providerConfig.base_url,
    apiKey: providerConfig.api_key,
  })
  return { model: openaiCompatProvider.chat(providerConfig.default_model), supportsTemperature: true }
}

export async function generate(options: StreamOptions): Promise<GenerationResult & { providerName?: string; providerType?: string; model?: string }> {
  try {
    const result = await executeWithFailover(
      async (providerConfig) => {
        const { model, supportsTemperature } = createModelForProvider(providerConfig)

        // AbortController with 90s timeout — prevents silent Vercel function hangs
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 90_000)

        try {
          const generationResult = await generateText({
            model,
            system: options.systemPrompt,
            prompt: options.userPrompt,
            maxOutputTokens: options.maxTokens || 4096,
            ...(supportsTemperature ? { temperature: options.temperature ?? 0.7 } : {}),
            abortSignal: controller.signal,
          })

          return {
            text: generationResult.text,
            usage: generationResult.usage ? {
              inputTokens: generationResult.usage.inputTokens ?? 0,
              outputTokens: generationResult.usage.outputTokens ?? 0,
              totalTokens: (generationResult.usage.inputTokens ?? 0) + (generationResult.usage.outputTokens ?? 0),
            } : undefined,
          }
        } finally {
          clearTimeout(timeoutId)
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
      const { model, supportsTemperature } = createModelForProvider(providerConfig)

      return streamText({
        model,
        system: options.systemPrompt,
        prompt: options.userPrompt,
        maxOutputTokens: options.maxTokens || 4096,
        ...(supportsTemperature ? { temperature: options.temperature ?? 0.7 } : {}),
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
