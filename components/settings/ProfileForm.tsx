"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ProfileData {
  full_name: string
  nim: string
  university_name: string
  faculty: string
  study_program: string
  upbjj_branch: string
}

interface ProfileFormProps {
  className?: string
}

export function ProfileForm({ className }: ProfileFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<ProfileData>({
    full_name: "",
    nim: "",
    university_name: "",
    faculty: "",
    study_program: "",
    upbjj_branch: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({})

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile")
        if (response.ok) {
          const result = await response.json()
          const data = result.data
          setFormData({
            full_name: data.full_name || "",
            nim: data.nim || "",
            university_name: data.university_name || "",
            faculty: data.faculty || "",
            study_program: data.study_program || "",
            upbjj_branch: data.upbjj_branch || "",
          })
        } else {
          const errorData = await response.json()
          toast.error("Gagal memuat data profil", {
            description: errorData.error || "Silakan coba lagi"
          })
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

    if (!formData.nim.trim()) {
      newErrors.nim = "NIM wajib diisi"
    }

    if (!formData.university_name.trim()) {
      newErrors.university_name = "Nama universitas wajib diisi"
    }

    if (!formData.faculty.trim()) {
      newErrors.faculty = "Fakultas wajib diisi"
    }

    if (!formData.study_program.trim()) {
      newErrors.study_program = "Program studi wajib diisi"
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
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Profil berhasil diperbarui")
        router.refresh()
      } else {
        const data = await response.json()
        toast.error("Gagal memperbarui profil", {
          description: data.error || "Silakan coba lagi"
        })
      }
    } catch {
      toast.error("Terjadi kesalahan", {
        description: "Gagal memperbarui profil. Silakan coba lagi."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof ProfileData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (isFetching) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
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
          <Label htmlFor="nim">NIM</Label>
          <Input
            id="nim"
            type="text"
            value={formData.nim}
            onChange={handleChange("nim")}
            placeholder="Masukkan NIM Anda"
            disabled={isLoading}
            className={cn(
              errors.nim && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.nim && (
            <p className="text-sm text-red-600">{errors.nim}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="university_name">Universitas</Label>
          <Input
            id="university_name"
            type="text"
            value={formData.university_name}
            onChange={handleChange("university_name")}
            placeholder="Masukkan nama universitas Anda"
            disabled={isLoading}
            className={cn(
              errors.university_name && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.university_name && (
            <p className="text-sm text-red-600">{errors.university_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="faculty">Fakultas</Label>
          <Input
            id="faculty"
            type="text"
            value={formData.faculty}
            onChange={handleChange("faculty")}
            placeholder="Masukkan nama fakultas Anda"
            disabled={isLoading}
            className={cn(
              errors.faculty && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.faculty && (
            <p className="text-sm text-red-600">{errors.faculty}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="study_program">Program Studi</Label>
          <Input
            id="study_program"
            type="text"
            value={formData.study_program}
            onChange={handleChange("study_program")}
            placeholder="Masukkan program studi Anda"
            disabled={isLoading}
            className={cn(
              errors.study_program && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.study_program && (
            <p className="text-sm text-red-600">{errors.study_program}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="upbjj_branch">UPBJJ Branch (Opsional)</Label>
          <Input
            id="upbjj_branch"
            type="text"
            value={formData.upbjj_branch}
            onChange={handleChange("upbjj_branch")}
            placeholder="Masukkan UPBJJ branch Anda"
            disabled={isLoading}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Menyimpan..." : "Simpan Profil"}
      </Button>
    </form>
  )
}