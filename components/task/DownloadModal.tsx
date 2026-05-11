"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { X, Download, FileText, BookOpen, FileType2 } from "lucide-react"

type FontFamily = "Helvetica" | "Times-Roman"
export type DownloadFormat = "pdf" | "docx"

export interface DownloadOptions {
  format: DownloadFormat
  withCover: boolean
  sessionNumber?: number
  fontFamily: FontFamily
}

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  onDownload: (options: DownloadOptions) => void
  isUT: boolean
  courseName?: string
}

export function DownloadModal({
  isOpen,
  onClose,
  onDownload,
  isUT,
  courseName,
}: DownloadModalProps) {
  const [format, setFormat] = useState<DownloadFormat>("docx")
  const [withCover, setWithCover] = useState(false)
  const [sessionNumber, setSessionNumber] = useState("")
  const [fontFamily, setFontFamily] = useState<FontFamily>("Times-Roman")
  const [error, setError] = useState("")

  const handleDownload = () => {
    if (withCover && isUT) {
      const num = parseInt(sessionNumber)
      if (!sessionNumber.trim() || isNaN(num) || num < 1 || num > 8) {
        setError("Masukkan nomor sesi yang valid (1-8)")
        return
      }
      onDownload({ format, withCover: true, sessionNumber: num, fontFamily })
    } else {
      onDownload({ format, withCover: false, fontFamily })
    }
    handleClose()
  }

  const handleClose = () => {
    setFormat("docx")
    setWithCover(false)
    setSessionNumber("")
    setError("")
    onClose()
  }

  if (!isOpen) return null

  const isDocx = format === "docx"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-zinc-900">
              Download Jawaban
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-700"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-4">
          {courseName && (
            <div className="flex items-center gap-2 text-sm text-zinc-600 bg-zinc-50 rounded-lg px-3 py-2">
              <BookOpen className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="truncate">{courseName}</span>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium text-zinc-700">
              Format File
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors text-center",
                  isDocx
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                <input
                  type="radio"
                  name="formatOption"
                  checked={isDocx}
                  onChange={() => setFormat("docx")}
                  className="sr-only"
                />
                <FileType2
                  className={cn(
                    "w-5 h-5",
                    isDocx ? "text-emerald-600" : "text-zinc-500"
                  )}
                />
                <span className="text-sm font-medium text-zinc-800">Word (.docx)</span>
                <span className="text-[11px] text-zinc-500 leading-tight">
                  Bisa diedit di Word
                </span>
              </label>
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors text-center",
                  !isDocx
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                <input
                  type="radio"
                  name="formatOption"
                  checked={!isDocx}
                  onChange={() => setFormat("pdf")}
                  className="sr-only"
                />
                <FileText
                  className={cn(
                    "w-5 h-5",
                    !isDocx ? "text-emerald-600" : "text-zinc-500"
                  )}
                />
                <span className="text-sm font-medium text-zinc-800">PDF</span>
                <span className="text-[11px] text-zinc-500 leading-tight">
                  Siap kumpul final
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-zinc-700">
              Font Dokumen
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-center",
                  fontFamily === "Times-Roman"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                <input
                  type="radio"
                  name="fontOption"
                  checked={fontFamily === "Times-Roman"}
                  onChange={() => setFontFamily("Times-Roman")}
                  className="accent-emerald-600"
                />
                <span className="text-sm text-zinc-700" style={{ fontFamily: 'Times New Roman, serif' }}>
                  Times New Roman
                </span>
              </label>
              <label
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-center",
                  fontFamily === "Helvetica"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                <input
                  type="radio"
                  name="fontOption"
                  checked={fontFamily === "Helvetica"}
                  onChange={() => setFontFamily("Helvetica")}
                  className="accent-emerald-600"
                />
                <span className="text-sm text-zinc-700" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                  Arial
                </span>
              </label>
            </div>
          </div>

          {isUT && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-zinc-700">
                Opsi Cover Page
              </Label>
              <div className="space-y-2">
                <label
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    !withCover
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  <input
                    type="radio"
                    name="coverOption"
                    checked={!withCover}
                    onChange={() => {
                      setWithCover(false)
                      setError("")
                    }}
                    className="accent-emerald-600"
                  />
                  <span className="text-sm text-zinc-700">Tanpa Cover</span>
                </label>
                <label
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    withCover
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  <input
                    type="radio"
                    name="coverOption"
                    checked={withCover}
                    onChange={() => setWithCover(true)}
                    className="accent-emerald-600"
                  />
                  <span className="text-sm text-zinc-700">
                    Dengan Cover Universitas Terbuka
                  </span>
                </label>
              </div>

              {withCover && (
                <div className="space-y-2 pt-1">
                  <Label htmlFor="sessionNumber" className="text-sm">
                    Tugas Tutorial Sesi ke-
                  </Label>
                  <Input
                    id="sessionNumber"
                    type="number"
                    min={1}
                    max={8}
                    value={sessionNumber}
                    onChange={(e) => {
                      setSessionNumber(e.target.value)
                      setError("")
                    }}
                    placeholder="Contoh: 1"
                    className={cn(
                      "w-full",
                      error && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {error && (
                    <p className="text-xs text-red-600">{error}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0 sticky bottom-0 bg-white">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
          >
            Batal
          </Button>
          <Button
            className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
            Download {isDocx ? "Word" : "PDF"}
          </Button>
        </div>
      </div>
    </div>
  )
}
