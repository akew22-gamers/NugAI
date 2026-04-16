"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface ProfileData {
  full_name: string
  student_id: string
  university: string
  major: string
}

interface ProfileFormProps {
  className?: string
}

export function ProfileForm({ className }: ProfileFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<ProfileData>({
    full_name: "",
    student_id: "",
    university: "",
    major: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({})

  // Fetch current profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile")
        if (response.ok) {
          const data = await response.json()
          setFormData({
            full_name: data.full_name || "",
            student_id: data.student_id || "",
            university: data.university || "",
            major: data.major || "",
          })
        } else {
          toast.error("Gagal memuat data profil")
        }
      } catch {
        toast.error("Gagal memuat data profil")
      } finally {
        setIsFetching(false)
      }
    }

    fetchProfile()
  }, [])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileData, string>> = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Nama lengkap wajib diisi"
    }

    if (!formData.student_id.trim()) {
      newErrors.student_id = "NIM wajib diisi"
    }

    if (!formData.university.trim()) {
      newErrors.university = "Nama universitas wajib diisi"
    }

    if (!formData.major.trim()) {
      newErrors.major = "Program studi wajib diisi"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Profile updated successfully")
        router.push("/dashboard")
        router.refresh()
      } else {
        const data = await response.json()
        toast.error("Failed to update profile", {
          description: data.error || "Please try again",
        })
      }
    } catch {
      toast.error("An error occurred", {
        description: "Failed to update profile. Please try again.",
      })
    } finally {
      setIsLoading(false)
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

  if (isFetching) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-zinc-200 rounded animate-pulse" />
              <div className="h-9 w-full bg-zinc-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-9 w-full bg-zinc-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nama Lengkap</Label>
          <Input
            id="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange("full_name")}
            placeholder="Masukkan nama lengkap Anda"
            disabled={isLoading}
            className={cn(
              errors.full_name && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.full_name && (
            <p className="text-sm text-red-600">{errors.full_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="student_id">NIM</Label>
          <Input
            id="student_id"
            type="text"
            value={formData.student_id}
            onChange={handleChange("student_id")}
            placeholder="Masukkan NIM Anda"
            disabled={isLoading}
            className={cn(
              errors.student_id && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.student_id && (
            <p className="text-sm text-red-600">{errors.student_id}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="university">Universitas</Label>
          <Input
            id="university"
            type="text"
            value={formData.university}
            onChange={handleChange("university")}
            placeholder="Masukkan nama universitas Anda"
            disabled={isLoading}
            className={cn(
              errors.university && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.university && (
            <p className="text-sm text-red-600">{errors.university}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="major">Program Studi</Label>
          <Input
            id="major"
            type="text"
            value={formData.major}
            onChange={handleChange("major")}
            placeholder="Masukkan program studi Anda"
            disabled={isLoading}
            className={cn(
              errors.major && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.major && (
            <p className="text-sm text-red-600">{errors.major}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Menyimpan..." : "Simpan Profil"}
      </Button>
    </form>
  )
}
