export type MarkdownToken =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'list_item'; marker: string; content: string }
  | { type: 'sub_item'; marker: string; content: string }
  | { type: 'section_header'; content: string }
  | { type: 'table'; headers: string[]; rows: string[][]; alignments: Array<'left' | 'center' | 'right' | null> }

type InternalToken = MarkdownToken | { type: 'blank' }

interface TableCandidate {
  headerLine: string
  separatorLine: string
  rowLines: string[]
}

function looksLikeTableRow(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|', 1)
}

function looksLikeTableSeparator(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return false
  const inner = trimmed.slice(1, -1)
  return inner.split('|').every((cell) => /^\s*:?-{3,}:?\s*$/.test(cell))
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim()
  const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed
  const cleanInner = inner.endsWith('|') ? inner.slice(0, -1) : inner
  return cleanInner.split('|').map((c) => c.trim())
}

function parseAlignment(separator: string): Array<'left' | 'center' | 'right' | null> {
  const cells = splitTableRow(separator)
  return cells.map((cell) => {
    const t = cell.trim()
    const left = t.startsWith(':')
    const right = t.endsWith(':')
    if (left && right) return 'center'
    if (right) return 'right'
    if (left) return 'left'
    return null
  })
}

function detectTableAt(lines: string[], startIdx: number): TableCandidate | null {
  if (startIdx + 1 >= lines.length) return null
  const headerLine = lines[startIdx]
  const separatorLine = lines[startIdx + 1]
  if (!looksLikeTableRow(headerLine)) return null
  if (!looksLikeTableSeparator(separatorLine)) return null

  const rowLines: string[] = []
  let i = startIdx + 2
  while (i < lines.length && looksLikeTableRow(lines[i])) {
    rowLines.push(lines[i])
    i++
  }
  return { headerLine, separatorLine, rowLines }
}

function stripInlineMarkdown(text: string): string {
  let t = text
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1')
  t = t.replace(/\*([^*]+)\*/g, '$1')
  t = t.replace(/__([^_]+)__/g, '$1')
  t = t.replace(/_([^_]+)_/g, '$1')
  t = t.replace(/`([^`]+)`/g, '$1')
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
  return t
}

export function parseMarkdownToTokens(markdown: string): MarkdownToken[] {
  if (!markdown) return []
  const lines = markdown.split('\n')
  const tokens: InternalToken[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      tokens.push({ type: 'blank' })
      i++
      continue
    }

    const table = detectTableAt(lines, i)
    if (table) {
      const headers = splitTableRow(table.headerLine).map(stripInlineMarkdown)
      const alignments = parseAlignment(table.separatorLine)
      const rows = table.rowLines.map((r) =>
        splitTableRow(r).map(stripInlineMarkdown),
      )
      tokens.push({ type: 'table', headers, rows, alignments })
      i += 2 + table.rowLines.length
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6
      tokens.push({ type: 'heading', level, content: stripInlineMarkdown(headingMatch[2]) })
      i++
      continue
    }

    const sectionMatch = trimmed.match(/^(Diketahui|Ditanyakan|Penyelesaian|Jawab|Kesimpulan)\s*[:.]?\s*$/i)
    if (sectionMatch) {
      tokens.push({ type: 'section_header', content: sectionMatch[1] })
      i++
      continue
    }

    const numberedMatch = trimmed.match(/^(\d+[.)]\s*|[a-z][.)]\s*)(.+)$/i)
    if (numberedMatch) {
      tokens.push({
        type: 'list_item',
        marker: numberedMatch[1].trim(),
        content: stripInlineMarkdown(numberedMatch[2].trim()),
      })
      i++
      continue
    }

    const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/)
    if (bulletMatch) {
      tokens.push({
        type: 'sub_item',
        marker: '-',
        content: stripInlineMarkdown(bulletMatch[1].trim()),
      })
      i++
      continue
    }

    tokens.push({ type: 'paragraph', content: stripInlineMarkdown(trimmed) })
    i++
  }

  const merged: InternalToken[] = []
  for (const tok of tokens) {
    const last = merged[merged.length - 1]
    if (tok.type === 'paragraph' && last && last.type === 'paragraph') {
      last.content += ' ' + tok.content
      continue
    }
    if (tok.type === 'blank') {
      if (last && last.type !== 'blank') {
        merged.push(tok)
      }
      continue
    }
    merged.push(tok)
  }

  while (merged.length > 0 && merged[merged.length - 1].type === 'blank') {
    merged.pop()
  }

  return merged.filter((t): t is MarkdownToken => t.type !== 'blank')
}
