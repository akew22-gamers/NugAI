"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface CourseData {
  courseName: string
  courseCode: string
}

interface CourseStepProps {
  onNext: (data: CourseData | null) => void
  onBack: () => void
  initialData?: Partial<CourseData> | null
  className?: string
}

export function CourseStep({ onNext, onBack, initialData, className }: CourseStepProps) {
  const [formData, setFormData] = useState<CourseData>({
    courseName: initialData?.courseName || "",
    courseCode: initialData?.courseCode || "",
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CourseData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CourseData, string>> = {}

    if (!formData.courseName.trim()) {
      newErrors.courseName = "Course name is required"
    }

    if (!formData.courseCode.trim()) {
      newErrors.courseCode = "Course code is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onNext(formData)
    }
  }

  const handleSkip = () => {
    onNext(null)
  }

  const handleChange = (field: keyof CourseData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-zinc-900">Add Your First Course</h2>
        <p className="text-zinc-600">
          Start by adding a course you are currently taking. You can always add more later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="courseName">Course Name</Label>
          <Input
            id="courseName"
            type="text"
            value={formData.courseName}
            onChange={handleChange("courseName")}
            placeholder="e.g., Introduction to Computer Science"
            className={cn(errors.courseName && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.courseName && (
            <p className="text-sm text-red-600">{errors.courseName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="courseCode">Course Code</Label>
          <Input
            id="courseCode"
            type="text"
            value={formData.courseCode}
            onChange={handleChange("courseCode")}
            placeholder="e.g., CS101"
            className={cn(errors.courseCode && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.courseCode && (
            <p className="text-sm text-red-600">{errors.courseCode}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button type="submit" className="w-full">
            Add Course
          </Button>
          <Button type="button" variant="ghost" onClick={handleSkip} className="w-full">
            Skip for now
          </Button>
          <Button type="button" variant="outline" onClick={onBack} className="w-full">
            Back
          </Button>
        </div>
      </form>
    </div>
  )
}
