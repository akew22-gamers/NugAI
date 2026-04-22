"use client"

import { Course, CourseCard } from "./CourseCard"
import { cn } from "@/lib/utils"
import { BookOpen, Loader2 } from "lucide-react"

interface CourseListProps {
  courses: Course[]
  isLoading?: boolean
  onEdit: (course: Course) => void
  onDelete: (course: Course) => void
  className?: string
}

export function CourseList({
  courses,
  isLoading = false,
  onEdit,
  onDelete,
  className,
}: CourseListProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Memuat data mata kuliah...</p>
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-20 px-4", className)}>
        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">
          Belum ada mata kuliah
        </h3>
        <p className="text-sm text-zinc-500 text-center max-w-sm">
          Tambah mata kuliah pertama Anda untuk mulai membuat tugas.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
        className
      )}
    >
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
