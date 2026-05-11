import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

let cachedService: TurndownService | null = null

function getTurndownService(): TurndownService {
  if (cachedService) return cachedService

  const service = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
  })

  service.use(gfm)

  service.addRule('removeEmptyParagraphs', {
    filter: (node) =>
      node.nodeName === 'P' && node.textContent?.trim() === '',
    replacement: () => '',
  })

  cachedService = service
  return service
}

export function tiptapHtmlToMarkdown(html: string): string {
  if (!html || !html.trim()) return ''
  const service = getTurndownService()
  const markdown = service.turndown(html)
  return markdown.trim()
}

export function isEmptyMarkdown(markdown: string): boolean {
  return !markdown || !markdown.replace(/\s|[*_#>\-|]/g, '').trim()
}
