import { createOpenAI } from '@ai-sdk/openai'
import { streamText, generateText } from 'ai'
import { getActiveProviderWithKey } from '@/lib/provider'

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

export async function getAIModel() {
  const providerData = await getActiveProviderWithKey()

  if (!providerData) {
    throw new Error('No active AI provider configured. Please configure a provider in Admin settings.')
  }

  const provider = createOpenAI({
    baseURL: providerData.config.base_url,
    apiKey: providerData.decryptedKey,
  })

  return provider(providerData.config.default_model)
}

export async function getProviderInfo() {
  const providerData = await getActiveProviderWithKey()

  if (!providerData) {
    throw new Error('No active AI provider configured')
  }

  return {
    providerName: providerData.config.provider_name,
    providerType: providerData.config.provider_type,
    model: providerData.config.default_model,
  }
}

export async function streamGenerate(options: StreamOptions) {
  const model = await getAIModel()

  const result = streamText({
    model,
    system: options.systemPrompt,
    prompt: options.userPrompt,
    maxOutputTokens: options.maxTokens || 4096,
    temperature: options.temperature || 0.7,
  })

  return result
}

export async function generate(options: StreamOptions): Promise<GenerationResult> {
  const model = await getAIModel()

  const result = await generateText({
    model,
    system: options.systemPrompt,
    prompt: options.userPrompt,
    maxOutputTokens: options.maxTokens || 4096,
    temperature: options.temperature || 0.7,
  })

  return {
    text: result.text,
    usage: result.usage ? {
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
      totalTokens: (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0),
    } : undefined,
  }
}

export function isProviderConfigured(): Promise<boolean> {
  return getActiveProviderWithKey()
    .then((data) => data !== null)
    .catch(() => false)
}