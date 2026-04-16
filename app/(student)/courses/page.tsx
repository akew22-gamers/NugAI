"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CourseList } from "@/components/courses/CourseList"
import { CourseModal, CourseFormData } from "@/components/courses/CourseModal"
import { Course } from "@/components/courses/CourseCard"
import { Plus, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"

export default function CoursesPage() {
  const { status } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  const fetchCourses = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/courses")
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Gagal memuat data mata kuliah")
      }
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchCourses()
    }
  }, [status])

  const handleAddCourse = async (formData: CourseFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course_name: formData.course_name,
          module_book_title: formData.module_book_title,
          tutor_name: formData.tutor_name,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Gagal menambahkan course")
      }

      toast.success("Course berhasil ditambahkan")
      await fetchCourses()
      setIsModalOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCourse = async (formData: CourseFormData) => {
    if (!editingCourse) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/courses/${editingCourse.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course_name: formData.course_name,
          module_book_title: formData.module_book_title,
          tutor_name: formData.tutor_name,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Gagal mengupdate course")
      }

      toast.success("Course berhasil diperbarui")
      await fetchCourses()
      setIsModalOpen(false)
      setEditingCourse(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCourse = async (course: Course) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus course "${course.course_name}"?\n\nTindakan ini tidak dapat dibatalkan.`
    )

    if (!confirmed) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Gagal menghapus course")
      }

      toast.success("Course berhasil dihapus")
      await fetchCourses()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openAddModal = () => {
    setEditingCourse(null)
    setIsModalOpen(true)
  }

  const openEditModal = (course: Course) => {
    setEditingCourse(course)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false)
      setEditingCourse(null)
    }
  }

  if (status === "loading" || (status === "authenticated" && isLoading && courses.length === 0)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-900 mx-auto" />
          <p className="mt-2 text-sm text-zinc-500">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500">Silakan login untuk mengakses halaman courses</p>
          <Link href="/login">
            <Button className="mt-4">Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Courses</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Kelola mata kuliah yang sedang Anda ambil
          </p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Course
        </Button>
      </div>

      <CourseList
        courses={courses}
        isLoading={isLoading}
        onEdit={openEditModal}
        onDelete={handleDeleteCourse}
      />

      <CourseModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingCourse ? handleEditCourse : handleAddCourse}
        course={editingCourse}
      />
    </div>
  )
}
