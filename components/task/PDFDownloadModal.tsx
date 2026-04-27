"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { X, Download, FileText, BookOpen } from "lucide-react"

interface PDFDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  onDownload: (options: { withCover: boolean; sessionNumber?: number }) => void
  isUT: boolean
  courseName?: string
}

export function PDFDownloadModal({
  isOpen,
  onClose,
  onDownload,
  isUT,
  courseName,
}: PDFDownloadModalProps) {
  const [withCover, setWithCover] = useState(false)
  const [sessionNumber, setSessionNumber] = useState("")
  const [error, setError] = useState("")

  const handleDownload = () => {
    if (withCover && isUT) {
      const num = parseInt(sessionNumber)
      if (!sessionNumber.trim() || isNaN(num) || num < 1 || num > 8) {
        setError("Masukkan nomor sesi yang valid (1-8)")
        return
      }
      onDownload({ withCover: true, sessionNumber: num })
    } else {
      onDownload({ withCover: false })
    }
    handleClose()
  }

  const handleClose = () => {
    setWithCover(false)
    setSessionNumber("")
    setError("")
    onClose()
  }

  if (!isOpen) return null

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

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-zinc-900">
              Download PDF
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

          {!isUT && (
            <p className="text-sm text-zinc-600">
              Dokumen PDF akan di-download tanpa halaman cover.
            </p>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
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
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}
