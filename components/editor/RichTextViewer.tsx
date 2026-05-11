"use client"

import { useMemo } from 'react'
import { markdownToHtml } from '@/lib/markdown/markdown-to-html'
import { cn } from '@/lib/utils'

interface RichTextViewerProps {
  markdown: string
  className?: string
}

export function RichTextViewer({ markdown, className }: RichTextViewerProps) {
  const html = useMemo(() => markdownToHtml(markdown), [markdown])

  if (!markdown || !markdown.trim()) {
    return (
      <p className={cn('text-zinc-400 italic text-sm', className)}>
        Belum ada konten
      </p>
    )
  }

  return (
    <div
      className={cn(
        'prose prose-sm max-w-none text-zinc-800',
        'prose-headings:font-semibold prose-p:my-2',
        'prose-p:leading-relaxed',
        'prose-strong:text-zinc-900',
        'prose-ol:my-2 prose-ul:my-2',
        'prose-li:my-0.5',
        'rtv-content',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function RichTextViewerStyles() {
  return (
    <style jsx global>{`
      .rtv-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 12px 0;
        font-size: 0.875rem;
      }
      .rtv-content table td,
      .rtv-content table th {
        border: 1px solid rgb(212 212 216);
        padding: 6px 10px;
        vertical-align: top;
      }
      .rtv-content table th {
        background-color: rgb(244 244 245);
        font-weight: 600;
        text-align: left;
      }
      .rtv-content table tr:nth-child(even) td {
        background-color: rgb(250 250 250);
      }
    `}</style>
  )
}
