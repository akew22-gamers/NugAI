"use client"

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Placeholder } from '@tiptap/extension-placeholder'
import { useEffect, useState } from 'react'
import { tiptapHtmlToMarkdown } from '@/lib/markdown/tiptap-to-markdown'
import { markdownToHtml } from '@/lib/markdown/markdown-to-html'
import { EditorToolbar } from './EditorToolbar'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  minHeight?: number
  disabled?: boolean
  error?: boolean
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Ketik di sini...',
  minHeight = 200,
  disabled = false,
  error = false,
  className,
}: RichTextEditorProps) {
  const [showGrid, setShowGrid] = useState(true)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: 'rte-table' },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: value ? markdownToHtml(value) : '',
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const markdown = tiptapHtmlToMarkdown(html)
      onChange(markdown)
    },
  })

  useEffect(() => {
    if (!editor) return
    const currentMarkdown = tiptapHtmlToMarkdown(editor.getHTML())
    if (value !== currentMarkdown) {
      editor.commands.setContent(value ? markdownToHtml(value) : '', { emitUpdate: false })
    }
  }, [value, editor])

  useEffect(() => {
    if (editor) editor.setEditable(!disabled)
  }, [disabled, editor])

  if (!editor) {
    return (
      <div
        className={cn(
          'rounded-lg border border-zinc-200 bg-zinc-50 animate-pulse',
          error && 'border-red-500',
          className,
        )}
        style={{ minHeight }}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200 bg-white overflow-hidden',
        'focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-400',
        error && 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500',
        disabled && 'opacity-60 pointer-events-none',
        className,
      )}
    >
      <EditorToolbar
        editor={editor}
        disabled={disabled}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((prev) => !prev)}
      />
      <div
        style={{ minHeight }}
        className={cn('overflow-auto rte-content', !showGrid && 'table-grid-hidden')}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export type { Editor }
