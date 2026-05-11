"use client"

import { type Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Table as TableIcon,
  Heading2,
  Undo2,
  Redo2,
  Plus,
  Minus,
  Trash2,
  Columns,
  Rows,
  Grid3x3,
  Grid2x2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
        'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
        active && 'bg-zinc-200 text-zinc-900',
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-zinc-200 mx-1" />
}

interface EditorToolbarProps {
  editor: Editor
  disabled?: boolean
  showGrid?: boolean
  onToggleGrid?: () => void
}

export function EditorToolbar({
  editor,
  disabled,
  showGrid = true,
  onToggleGrid,
}: EditorToolbarProps) {
  const isInTable = editor.isActive('table')

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-200 bg-zinc-50/50 flex-wrap">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        disabled={disabled}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        disabled={disabled}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        active={editor.isActive('heading', { level: 2 })}
        disabled={disabled}
        title="Judul"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        disabled={disabled}
        title="List"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        disabled={disabled}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        active={isInTable}
        disabled={disabled}
        title="Sisipkan tabel"
      >
        <TableIcon className="w-4 h-4" />
      </ToolbarButton>

      {onToggleGrid && (
        <ToolbarButton
          onClick={onToggleGrid}
          active={!showGrid}
          disabled={disabled}
          title={showGrid ? 'Sembunyikan garis tabel' : 'Tampilkan garis tabel'}
        >
          {showGrid ? (
            <Grid3x3 className="w-4 h-4" />
          ) : (
            <Grid2x2 className="w-4 h-4 text-zinc-400" />
          )}
        </ToolbarButton>
      )}

      {isInTable && (
        <>
          <Divider />
          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            disabled={disabled}
            title="Tambah kolom"
          >
            <span className="flex items-center">
              <Columns className="w-3.5 h-3.5" />
              <Plus className="w-2.5 h-2.5 -ml-0.5" />
            </span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().addRowAfter().run()}
            disabled={disabled}
            title="Tambah baris"
          >
            <span className="flex items-center">
              <Rows className="w-3.5 h-3.5" />
              <Plus className="w-2.5 h-2.5 -ml-0.5" />
            </span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            disabled={disabled}
            title="Hapus kolom"
          >
            <span className="flex items-center">
              <Columns className="w-3.5 h-3.5" />
              <Minus className="w-2.5 h-2.5 -ml-0.5" />
            </span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            disabled={disabled}
            title="Hapus baris"
          >
            <span className="flex items-center">
              <Rows className="w-3.5 h-3.5" />
              <Minus className="w-2.5 h-2.5 -ml-0.5" />
            </span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            disabled={disabled}
            title="Hapus tabel"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </ToolbarButton>
        </>
      )}

      <div className="flex-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="w-4 h-4" />
      </ToolbarButton>
    </div>
  )
}
