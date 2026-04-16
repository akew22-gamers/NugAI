"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BookOpen, GraduationCap, Pencil, Trash2, User } from "lucide-react"
import { useState } from "react"

export interface Course {
  id: string
  course_name: string
  module_book_title: string
  tutor_name: string
  created_at: string
}

interface CourseCardProps {
  course: Course
  onEdit: (course: Course) => void
  onDelete: (course: Course) => void
  className?: string
}

export function CourseCard({ course, onEdit, onDelete, className }: CourseCardProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className={cn(
        "group relative bg-white rounded-xl border border-zinc-200 p-6 shadow-sm",
        "hover:shadow-md hover:border-zinc-300 transition-all duration-200",
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-900 truncate text-base leading-tight">
              {course.course_name}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {new Date(course.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-1 transition-opacity duration-200",
            showActions ? "opacity-100" : "opacity-0"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-600 hover:text-zinc-900"
            onClick={() => onEdit(course)}
            aria-label="Edit course"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-600 hover:text-red-600"
            onClick={() => onDelete(course)}
            aria-label="Delete course"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <GraduationCap className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-zinc-500 mb-0.5">Modul/Buku</p>
            <p className="text-sm text-zinc-700 truncate">{course.module_book_title}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <User className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-zinc-500 mb-0.5">Tutor</p>
            <p className="text-sm text-zinc-700 truncate">{course.tutor_name}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
