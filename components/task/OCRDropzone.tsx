"use client"

import { useState, useCallback } from "react"
import { Upload, Loader2, X } from "lucide-react"
import { processImageOCR, OCRResult } from "@/lib/ocr"
import { toast } from "sonner"

interface OCRDropzoneProps {
  onComplete: (text: string) => void
}

export function OCRDropzone({ onComplete }: OCRDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files).filter(
        (file) => file.type.startsWith("image/")
      )

      if (files.length === 0) {
        toast.error("Hanya file gambar yang didukung")
        return
      }

      setUploadedFiles(files)
      await processFiles(files)
    },
    [onComplete]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter(
        (file) => file.type.startsWith("image/")
      )

      if (files.length === 0) {
        toast.error("Hanya file gambar yang didukung")
        return
      }

      setUploadedFiles(files)
      await processFiles(files)
    },
    [onComplete]
  )

  const processFiles = async (files: File[]) => {
    setIsProcessing(true)

    try {
      const results: OCRResult[] = []

      for (const file of files) {
        try {
          const result = await processImageOCR(file)
          results.push(result)
        } catch (error) {
          console.error(`OCR failed for ${file.name}:`, error)
        }
      }

      const combinedText = results
        .map((r) => r.text)
        .filter((text) => text.length > 0)
        .join("\n\n")

      if (combinedText) {
        onComplete(combinedText)
        toast.success(`OCR berhasil untuk ${results.length} gambar`)
      } else {
        toast.error("OCR gagal membaca gambar. Input manual.")
      }
    } catch (error) {
      toast.error("OCR gagal. Silakan input manual.")
    } finally {
      setIsProcessing(false)
    }
  }

  const clearFiles = () => {
    setUploadedFiles([])
  }

  return (
    <div className="space-y-2">
      {uploadedFiles.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <span>{uploadedFiles.length} gambar uploaded</span>
          <button
            onClick={clearFiles}
            className="text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        className={`relative border-2 rounded-lg p-4 transition-colors ${
          isDragging
            ? "border-zinc-400 bg-zinc-50"
            : "border-zinc-200 hover:border-zinc-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2 text-zinc-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Memproses OCR...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-zinc-600">
            <Upload className="w-5 h-5" />
            <span>Drag & drop gambar atau klik untuk upload</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileSelect}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400">
        Format: JPG, PNG, WebP. Maks 2MB per gambar. OCR akan extract text dari gambar.
      </p>
    </div>
  )
}