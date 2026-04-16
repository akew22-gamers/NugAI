"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface PasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface PasswordFormProps {
  className?: string
}

export function PasswordForm({ className }: PasswordFormProps) {
  const [formData, setFormData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PasswordData, string>> = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Kata sandi saat ini wajib diisi"
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Kata sandi baru wajib diisi"
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Kata sandi minimal 8 karakter"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi kata sandi baru Anda"
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Kata sandi tidak sama"
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
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      if (response.ok) {
        toast.success("Kata sandi berhasil diubah")
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        const data = await response.json()
        toast.error("Gagal mengubah kata sandi", {
          description: data.error || "Silakan coba lagi",
        })
      }
    } catch {
      toast.error("Terjadi kesalahan", {
        description: "Gagal mengubah kata sandi. Silakan coba lagi.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof PasswordData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
          <Input
            id="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleChange("currentPassword")}
            placeholder="Masukkan kata sandi saat ini"
            disabled={isLoading}
            className={cn(
              errors.currentPassword && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.currentPassword && (
            <p className="text-sm text-red-600">{errors.currentPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Kata Sandi Baru</Label>
          <Input
            id="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange("newPassword")}
            placeholder="Masukkan kata sandi baru (min 8 karakter)"
            disabled={isLoading}
            className={cn(
              errors.newPassword && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.newPassword && (
            <p className="text-sm text-red-600">{errors.newPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
            placeholder="Konfirmasi kata sandi baru Anda"
            disabled={isLoading}
            className={cn(
              errors.confirmPassword && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Mengubah..." : "Ubah Kata Sandi"}
      </Button>
    </form>
  )
}
