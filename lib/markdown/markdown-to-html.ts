import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: false,
})

export function markdownToHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) return ''
  return marked.parse(markdown, { async: false }) as string
}

export function looksLikeMarkdown(text: string): boolean {
  if (!text) return false
  const patterns = [
    /^\s*\|.+\|.*$/m,
    /^#{1,6}\s/m,
    /\*\*[^*]+\*\*/,
    /^\s*[-*+]\s/m,
    /^\s*\d+\.\s/m,
    /\[([^\]]+)\]\(([^)]+)\)/,
  ]
  return patterns.some((p) => p.test(text))
}
