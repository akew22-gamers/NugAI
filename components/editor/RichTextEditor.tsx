"use client"

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Placeholder } from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
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
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none px-3 py-2',
          'prose-headings:font-semibold prose-p:my-2',
          'prose-table:my-3 prose-td:border prose-td:border-zinc-300 prose-td:px-2 prose-td:py-1',
          'prose-th:border prose-th:border-zinc-300 prose-th:bg-zinc-50 prose-th:px-2 prose-th:py-1',
        ),
      },
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
      <EditorToolbar editor={editor} disabled={disabled} />
      <div style={{ minHeight }} className="overflow-auto rte-content">
        <EditorContent editor={editor} />
      </div>
      <style jsx global>{`
        .rte-content .ProseMirror {
          min-height: inherit;
          outline: none;
        }
        .rte-content .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: rgb(161 161 170);
          pointer-events: none;
          height: 0;
          float: left;
        }
        .rte-content .rte-table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 12px 0;
          overflow: hidden;
        }
        .rte-content .rte-table td,
        .rte-content .rte-table th {
          border: 1px solid rgb(212 212 216);
          padding: 6px 10px;
          vertical-align: top;
          min-width: 60px;
        }
        .rte-content .rte-table th {
          background-color: rgb(244 244 245);
          font-weight: 600;
          text-align: left;
        }
        .rte-content .rte-table .selectedCell {
          background-color: rgb(220 252 231);
          position: relative;
        }
      `}</style>
    </div>
  )
}

export type { Editor }
