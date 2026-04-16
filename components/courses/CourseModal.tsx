"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { X, Loader2, BookOpen, GraduationCap, User } from "lucide-react"
import { Course } from "./CourseCard"

export interface CourseFormData {
  course_name: string
  module_book_title: string
  tutor_name: string
}

interface CourseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CourseFormData) => Promise<void>
  course?: Course | null
  className?: string
}

export function CourseModal({
  isOpen,
  onClose,
  onSubmit,
  course,
  className,
}: CourseModalProps) {
  const [formData, setFormData] = useState<CourseFormData>({
    course_name: course?.course_name || "",
    module_book_title: course?.module_book_title || "",
    tutor_name: course?.tutor_name || "",
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!course

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CourseFormData, string>> = {}

    if (!formData.course_name.trim()) {
      newErrors.course_name = "Nama mata kuliah wajib diisi"
    } else if (formData.course_name.trim().length < 3) {
      newErrors.course_name = "Nama mata kuliah minimal 3 karakter"
    }

    if (!formData.module_book_title.trim()) {
      newErrors.module_book_title = "Judul modul/buku wajib diisi"
    } else if (formData.module_book_title.trim().length < 3) {
      newErrors.module_book_title = "Judul modul/buku minimal 3 karakter"
    }

    if (!formData.tutor_name.trim()) {
      newErrors.tutor_name = "Nama tutor wajib diisi"
    } else if (formData.tutor_name.trim().length < 3) {
      newErrors.tutor_name = "Nama tutor minimal 3 karakter"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      handleClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        course_name: "",
        module_book_title: "",
        tutor_name: "",
      })
      setErrors({})
      onClose()
    }
  }

  const handleChange = (field: keyof CourseFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
          <div>
            <h2
              id="modal-title"
              className="text-lg font-semibold text-zinc-900"
            >
              {isEditing ? "Edit Course" : "Tambah Course Baru"}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {isEditing
                ? "Perbarui informasi mata kuliah Anda"
                : "Tambahkan mata kuliah yang sedang Anda ambil"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-700"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="course_name" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-zinc-400" />
              Nama Mata Kuliah
            </Label>
            <Input
              id="course_name"
              type="text"
              value={formData.course_name}
              onChange={handleChange("course_name")}
              placeholder="Contoh: Pengantar Ilmu Komputer"
              disabled={isSubmitting}
              className={cn(
                errors.course_name &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {errors.course_name && (
              <p className="text-sm text-red-600">{errors.course_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="module_book_title"
              className="flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-zinc-400" />
              Judul Modul/Buku
            </Label>
            <Input
              id="module_book_title"
              type="text"
              value={formData.module_book_title}
              onChange={handleChange("module_book_title")}
              placeholder="Contoh: Modul Pengantar Ilmu Komputer"
              disabled={isSubmitting}
              className={cn(
                errors.module_book_title &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {errors.module_book_title && (
              <p className="text-sm text-red-600">
                {errors.module_book_title}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tutor_name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-400" />
              Nama Tutor
            </Label>
            <Input
              id="tutor_name"
              type="text"
              value={formData.tutor_name}
              onChange={handleChange("tutor_name")}
              placeholder="Contoh: Dr. Ahmad Fauzi"
              disabled={isSubmitting}
              className={cn(
                errors.tutor_name && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {errors.tutor_name && (
              <p className="text-sm text-red-600">{errors.tutor_name}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : isEditing ? (
                "Simpan Perubahan"
              ) : (
                "Tambah Course"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
