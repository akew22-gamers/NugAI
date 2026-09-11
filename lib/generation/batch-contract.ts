export interface BatchReference {
  type?: string
  title: string
  url?: string
  author?: string
  year?: string
  source?: string
}

export interface BatchAnswer {
  questionOrder: number
  answer: string
  references?: BatchReference[]
}

function extractJsonObject(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI tidak mengembalikan struktur jawaban yang valid')
  }
  return text.slice(start, end + 1)
}

export function parseBatchResponse(text: string, expectedCount: number): BatchAnswer[] {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
  const candidate = cleaned.startsWith('{') && cleaned.endsWith('}')
    ? cleaned
    : extractJsonObject(cleaned)
  let parsed: unknown
  try {
    parsed = JSON.parse(candidate) as unknown
  } catch {
    throw new Error('AI tidak mengembalikan struktur jawaban yang valid')
  }
  const answers = (parsed as { answers?: unknown }).answers
  if (!Array.isArray(answers)) {
    throw new Error('AI tidak mengembalikan struktur jawaban yang valid')
  }
  const valid = (answers as Array<Partial<BatchAnswer>>).filter(
    (item): item is BatchAnswer =>
      typeof item.questionOrder === 'number' &&
      Number.isInteger(item.questionOrder) &&
      typeof item.answer === 'string' &&
      item.answer.trim().length > 0,
  )
  const seen = new Set<number>()
  for (const item of valid) {
    if (item.questionOrder < 1 || item.questionOrder > expectedCount || seen.has(item.questionOrder)) {
      throw new Error('AI tidak mengembalikan struktur jawaban yang valid')
    }
    seen.add(item.questionOrder)
  }
  return valid
    .map((item) => ({
      questionOrder: item.questionOrder,
      answer: item.answer.trim(),
      references: Array.isArray(item.references)
        ? item.references.filter(
            (reference): reference is BatchReference =>
              !!reference && typeof reference.title === 'string' && reference.title.trim().length > 0,
          )
        : undefined,
    }))
    .sort((a, b) => a.questionOrder - b.questionOrder)
}

export function referenceKey(reference: BatchReference): string {
  return (reference.url || reference.title).trim().toLowerCase()
}

export function deduplicateReferences<T extends BatchReference>(references: T[]): T[] {
  return references.filter(
    (reference, index) =>
      reference.title &&
      references.findIndex((other) => referenceKey(other) === referenceKey(reference)) === index,
  )
}
