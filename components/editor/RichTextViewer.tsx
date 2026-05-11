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
      className={cn('rtv-content text-zinc-800', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function RichTextViewerStyles() {
  return null
}
