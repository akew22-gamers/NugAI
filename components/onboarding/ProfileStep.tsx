"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface ProfileData {
  fullName: string
  studentId: string
  university: string
  major: string
}

interface ProfileStepProps {
  onNext: (data: ProfileData) => void
  onBack: () => void
  initialData?: Partial<ProfileData> | null
  className?: string
}

export function ProfileStep({ onNext, onBack, initialData, className }: ProfileStepProps) {
  const [formData, setFormData] = useState<ProfileData>({
    fullName: initialData?.fullName || "",
    studentId: initialData?.studentId || "",
    university: initialData?.university || "",
    major: initialData?.major || "",
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileData, string>> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = "Student ID is required"
    }

    if (!formData.university.trim()) {
      newErrors.university = "University is required"
    }

    if (!formData.major.trim()) {
      newErrors.major = "Major is required"
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

  const handleChange = (field: keyof ProfileData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-zinc-900">Set Up Your Profile</h2>
        <p className="text-zinc-600">
          Tell us a bit about yourself to personalize your experience.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange("fullName")}
            placeholder="Enter your full name"
            className={cn(errors.fullName && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.fullName && (
            <p className="text-sm text-red-600">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="studentId">Student ID</Label>
          <Input
            id="studentId"
            type="text"
            value={formData.studentId}
            onChange={handleChange("studentId")}
            placeholder="Enter your student ID"
            className={cn(errors.studentId && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.studentId && (
            <p className="text-sm text-red-600">{errors.studentId}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="university">University</Label>
          <Input
            id="university"
            type="text"
            value={formData.university}
            onChange={handleChange("university")}
            placeholder="Enter your university name"
            className={cn(errors.university && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.university && (
            <p className="text-sm text-red-600">{errors.university}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="major">Major</Label>
          <Input
            id="major"
            type="text"
            value={formData.major}
            onChange={handleChange("major")}
            placeholder="Enter your major or field of study"
            className={cn(errors.major && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.major && (
            <p className="text-sm text-red-600">{errors.major}</p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </div>
  )
}
