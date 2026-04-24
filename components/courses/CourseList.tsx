"use client"

import { Course, CourseCard } from "./CourseCard"
import { cn } from "@/lib/utils"
import { BookOpen, Loader2 } from "lucide-react"
import { Loading } from "@/components/ui/loading"

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
      <Loading text="Memuat data mata kuliah..." />
    )
  }

  if (courses.length === 0) {
    return (
      <div className={cn("border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center min-h-[350px] p-8", className)}>
        <div className="flex flex-col items-center text-center max-w-xs">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mt-5">
            Belum ada mata kuliah
          </h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Tambah mata kuliah pertama Anda untuk mulai membuat tugas.
          </p>
        </div>
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
      {courses.map((course, index) => (
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
