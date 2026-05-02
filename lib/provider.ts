import { prisma } from '@/lib/prisma'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'
import { AIProviderType } from '@prisma/client'

export interface AIProviderConfig {
  id: string
  provider_type: AIProviderType
  provider_name: string
  base_url: string
  default_model: string
  is_active: boolean
  priority: number
  available_models?: {
    models: Array<{ id: string; name?: string; owned_by?: string }>
    fetched_at: string
  }
  last_model_fetch?: Date
  health_status?: string | null
  health_error?: string | null
  last_health_check?: Date | null
}

export interface CreateAIProviderInput {
  provider_type: AIProviderType
  provider_name: string
  base_url: string
  api_key: string
  default_model?: string
  priority?: number
}

export interface UpdateAIProviderInput {
  provider_name?: string
  base_url?: string
  api_key?: string
  default_model?: string
  is_active?: boolean
  priority?: number
}

export const PRESET_PROVIDERS: Record<AIProviderType, { name: string; base_url: string }> = {
  DEEPSEEK: { name: 'DeepSeek', base_url: 'https://api.deepseek.com' },
  OPENAI: { name: 'OpenAI', base_url: 'https://api.openai.com/v1' },
  GROQ: { name: 'Groq', base_url: 'https://api.groq.com/openai/v1' },
  TOGETHER: { name: 'Together AI', base_url: 'https://api.together.xyz/v1' },
  CUSTOM: { name: 'Custom', base_url: '' },
}

export async function getActiveAIProvider(): Promise<AIProviderConfig | null> {
  const provider = await prisma.aIProvider.findFirst({
    where: { is_active: true },
    select: {
      id: true,
      provider_type: true,
      provider_name: true,
      base_url: true,
      api_key: true,
      default_model: true,
      is_active: true,
      priority: true,
      available_models: true,
      last_model_fetch: true,
    },
    orderBy: [{ priority: 'desc' }, { created_at: 'asc' }],
  })

  if (!provider) return null

  return {
    id: provider.id,
    provider_type: provider.provider_type,
    provider_name: provider.provider_name,
    base_url: provider.base_url,
    default_model: provider.default_model,
    is_active: provider.is_active,
    priority: provider.priority,
    available_models: provider.available_models as AIProviderConfig['available_models'],
    last_model_fetch: provider.last_model_fetch ?? undefined,
  }
}

export async function getActiveProviderWithKey(): Promise<{
  config: AIProviderConfig
  decryptedKey: string
} | null> {
  const provider = await prisma.aIProvider.findFirst({
    where: { is_active: true },
    select: {
      id: true,
      provider_type: true,
      provider_name: true,
      base_url: true,
      api_key: true,
      default_model: true,
      is_active: true,
      priority: true,
      available_models: true,
      last_model_fetch: true,
    },
    orderBy: [{ priority: 'desc' }, { created_at: 'asc' }],
  })

  if (!provider) return null

  const decryptedKey = decryptApiKey(provider.api_key)

  return {
    config: {
      id: provider.id,
      provider_type: provider.provider_type,
      provider_name: provider.provider_name,
      base_url: provider.base_url,
      default_model: provider.default_model,
      is_active: provider.is_active,
      priority: provider.priority,
      available_models: provider.available_models as AIProviderConfig['available_models'],
      last_model_fetch: provider.last_model_fetch ?? undefined,
    },
    decryptedKey,
  }
}

export async function getAllAIProviders(): Promise<AIProviderConfig[]> {
  const providers = await prisma.aIProvider.findMany({
    select: {
      id: true,
      provider_type: true,
      provider_name: true,
      base_url: true,
      default_model: true,
      is_active: true,
      priority: true,
      available_models: true,
      last_model_fetch: true,
      health_status: true,
      health_error: true,
      last_health_check: true,
    },
    orderBy: [{ priority: 'desc' }, { created_at: 'asc' }],
  })

  return providers.map((p) => ({
    id: p.id,
    provider_type: p.provider_type,
    provider_name: p.provider_name,
    base_url: p.base_url,
    default_model: p.default_model,
    is_active: p.is_active,
    priority: p.priority,
    available_models: p.available_models as AIProviderConfig['available_models'],
    last_model_fetch: p.last_model_fetch ?? undefined,
    health_status: p.health_status,
    health_error: p.health_error,
    last_health_check: p.last_health_check,
  }))
}

export async function createAIProvider(input: CreateAIProviderInput): Promise<AIProviderConfig> {
  const encryptedKey = encryptApiKey(input.api_key)

  const preset = PRESET_PROVIDERS[input.provider_type]
  const baseUrl = input.provider_type === 'CUSTOM' ? input.base_url : preset.base_url
  const name = input.provider_type === 'CUSTOM' ? input.provider_name : preset.name

  const provider = await prisma.aIProvider.create({
    data: {
      provider_type: input.provider_type,
      provider_name: name,
      base_url: baseUrl,
      api_key: encryptedKey,
      default_model: input.default_model || '',
      is_active: true,
      priority: input.priority ?? 0,
    },
  })

  return {
    id: provider.id,
    provider_type: provider.provider_type,
    provider_name: provider.provider_name,
    base_url: provider.base_url,
    default_model: provider.default_model,
    is_active: provider.is_active,
    priority: provider.priority,
  }
}

export async function updateAIProvider(
  id: string,
  input: UpdateAIProviderInput
): Promise<AIProviderConfig> {
  const updateData: Record<string, unknown> = {}

  if (input.provider_name) updateData.provider_name = input.provider_name
  if (input.base_url) updateData.base_url = input.base_url
  if (input.api_key) updateData.api_key = encryptApiKey(input.api_key)
  if (input.default_model) updateData.default_model = input.default_model
  if (input.is_active !== undefined) updateData.is_active = input.is_active
  if (input.priority !== undefined) updateData.priority = input.priority

  const provider = await prisma.aIProvider.update({
    where: { id },
    data: updateData,
  })

  return {
    id: provider.id,
    provider_type: provider.provider_type,
    provider_name: provider.provider_name,
    base_url: provider.base_url,
    default_model: provider.default_model,
    is_active: provider.is_active,
    priority: provider.priority,
    available_models: provider.available_models as AIProviderConfig['available_models'],
    last_model_fetch: provider.last_model_fetch ?? undefined,
  }
}

export async function updateProviderModels(
  id: string,
  models: Array<{ id: string; name?: string; owned_by?: string }>
): Promise<void> {
  await prisma.aIProvider.update({
    where: { id },
    data: {
      available_models: {
        models,
        fetched_at: new Date().toISOString(),
      },
      last_model_fetch: new Date(),
    },
  })
}

export async function deleteAIProvider(id: string): Promise<void> {
  await prisma.aIProvider.delete({ where: { id } })
}

export async function setActiveProvider(id: string): Promise<void> {
  await prisma.$transaction([
    prisma.aIProvider.updateMany({
      where: { is_active: true },
      data: { is_active: false },
    }),
    prisma.aIProvider.update({
      where: { id },
      data: { is_active: true },
    }),
  ])
}

export async function fetchModelsFromProvider(
  baseUrl: string,
  apiKey: string
): Promise<Array<{ id: string; name?: string; owned_by?: string }>> {
  const response = await fetch(`${baseUrl}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.data || !Array.isArray(data.data)) {
    throw new Error('Invalid response format from provider')
  }

  return data.data.map((model: { id: string; name?: string; owned_by?: string }) => ({
    id: model.id,
    name: model.name || model.id,
    owned_by: model.owned_by || 'unknown',
  }))
}