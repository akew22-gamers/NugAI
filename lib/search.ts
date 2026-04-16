import { prisma } from '@/lib/prisma'
import { decryptApiKey } from '@/lib/encryption'
import { SearchProviderType } from '@prisma/client'

export interface SearchResult {
  title: string
  url: string
  content: string
  source: 'tavily' | 'exa'
  type?: 'journal' | 'book' | 'government' | 'web'
  metadata?: Record<string, unknown>
}

export interface SearchOptions {
  query: string
  maxResults?: number
  searchType?: 'general' | 'academic'
}

async function getSearchProviderKey(providerType: SearchProviderType): Promise<{ key: string; isActive: boolean } | null> {
  const provider = await prisma.searchProvider.findUnique({
    where: { provider_type: providerType },
    select: { api_key: true, is_active: true },
  })

  if (!provider) return null

  return {
    key: decryptApiKey(provider.api_key),
    isActive: provider.is_active,
  }
}

export async function tavilySearch(options: SearchOptions): Promise<SearchResult[]> {
  const providerData = await getSearchProviderKey('TAVILY')

  if (!providerData || !providerData.isActive) {
    return []
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerData.key}`,
      },
      body: JSON.stringify({
        query: options.query,
        max_results: options.maxResults || 5,
        include_raw_content: false,
        search_depth: 'advanced',
      }),
    })

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`)
    }

    const data = await response.json()

    return (data.results || []).map((result: { title: string; url: string; content: string }) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      source: 'tavily',
      type: 'web',
    }))
  } catch (error) {
    console.error('Tavily search failed:', error)
    return []
  }
}

export async function exaSearch(options: SearchOptions): Promise<SearchResult[]> {
  const providerData = await getSearchProviderKey('EXA')

  if (!providerData || !providerData.isActive) {
    return []
  }

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': providerData.key,
      },
      body: JSON.stringify({
        query: options.query,
        numResults: options.maxResults || 5,
        useAutoprompt: true,
        type: options.searchType === 'academic' ? 'neural' : 'keyword',
        contents: {
          text: true,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Exa API error: ${response.status}`)
    }

    const data = await response.json()

    return (data.results || []).map((result: { title: string; url: string; text?: string; author?: string; publishedDate?: string }) => ({
      title: result.title,
      url: result.url,
      content: result.text || '',
      source: 'exa',
      type: 'journal',
      metadata: {
        author: result.author,
        publishedDate: result.publishedDate,
      },
    }))
  } catch (error) {
    console.error('Exa search failed:', error)
    return []
  }
}

export async function combinedSearch(options: SearchOptions): Promise<{
  results: SearchResult[]
  tavilyResults: number
  exaResults: number
}> {
  const [tavilyResults, exaResults] = await Promise.all([
    tavilySearch(options),
    exaSearch({ ...options, searchType: 'academic' }),
  ])

  const combined = [...exaResults, ...tavilyResults]

  return {
    results: combined,
    tavilyResults: tavilyResults.length,
    exaResults: exaResults.length,
  }
}

export function formatSearchResultsForPrompt(results: SearchResult[]): string {
  if (results.length === 0) return ''

  return results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\nContent: ${r.content.slice(0, 500)}...`)
    .join('\n\n')
}

export function isSearchProviderConfigured(providerType: SearchProviderType): Promise<boolean> {
  return getSearchProviderKey(providerType)
    .then((data) => data !== null && data.isActive)
    .catch(() => false)
}