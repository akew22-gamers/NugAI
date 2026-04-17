"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SubscriptionTier, UserRole } from "@prisma/client"

interface User {
  id: string
  username: string
  role: UserRole
  subscription_tier: SubscriptionTier
  daily_usage_count: number
  last_usage_date: string | null
  created_at: string
  student_profile: {
    full_name: string
    nim: string
    university_name: string
    study_program: string
  } | null
  _count: {
    task_sessions: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("USER")
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("FREE")
  const [fullName, setFullName] = useState("")
  const [nim, setNim] = useState("")
  const [universityName, setUniversityName] = useState("")
  const [faculty, setFaculty] = useState("")
  const [studyProgram, setStudyProgram] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast.error("Gagal memuat data pengguna")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    fetchUsers()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      toast.error("Username dan password harus diisi")
      return
    }

    if (role === "USER" && (!fullName || !nim)) {
      toast.error("Nama lengkap dan NIM harus diisi untuk pengguna student")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          role,
          subscription_tier: subscriptionTier,
          full_name: fullName,
          nim,
          university_name: universityName,
          faculty,
          study_program: studyProgram,
        }),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        resetForm()
        fetchUsers()
        toast.success("Pengguna berhasil dibuat")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal membuat pengguna")
      }
    } catch (error) {
      console.error("Failed to create user:", error)
      toast.error("Gagal membuat pengguna")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateTier = async (userId: string, newTier: SubscriptionTier) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          subscription_tier: newTier,
        }),
      })

      if (response.ok) {
        fetchUsers()
        toast.success("Subscription berhasil diperbarui")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal memperbarui subscription")
      }
    } catch (error) {
      console.error("Failed to update tier:", error)
      toast.error("Gagal memperbarui subscription")
    }
  }

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt("Masukkan password baru (min 8 karakter):")
    if (!newPassword || newPassword.length < 8) {
      if (newPassword) toast.error("Password minimal 8 karakter")
      return
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          password: newPassword,
        }),
      })

      if (response.ok) {
        toast.success("Password berhasil direset")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal reset password")
      }
    } catch (error) {
      console.error("Failed to reset password:", error)
      toast.error("Gagal reset password")
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchUsers()
        toast.success("Pengguna berhasil dihapus")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal menghapus pengguna")
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast.error("Gagal menghapus pengguna")
    }
  }

  const resetForm = () => {
    setUsername("")
    setPassword("")
    setRole("USER")
    setSubscriptionTier("FREE")
    setFullName("")
    setNim("")
    setUniversityName("")
    setFaculty("")
    setStudyProgram("")
  }

  const openNewUserDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengguna</h1>
          <p className="text-slate-600 mt-1">
            Kelola pengguna aplikasi NugAI
          </p>
        </div>
        <Button onClick={openNewUserDialog}>Tambah Pengguna</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari username atau nama..."
              className="max-w-sm"
            />
            <Button variant="outline" onClick={handleSearch}>
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Memuat pengguna...</div>
      ) : users.length === 0 ? (
        <Card className="h-[200px]">
          <CardContent className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-slate-500">Belum ada pengguna terdaftar.</p>
            <p className="text-slate-500 mt-2">Tambahkan pengguna untuk mulai menggunakan aplikasi.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center py-6">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{user.username}</p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        user.subscription_tier === "PREMIUM"
                          ? "text-amber-600 bg-amber-50"
                          : "text-slate-600 bg-slate-100"
                      }`}
                    >
                      {user.subscription_tier}
                    </span>
                  </div>
                  {user.student_profile && (
                    <p className="text-sm text-slate-600">
                      {user.student_profile.full_name} ({user.student_profile.nim})
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    {user._count.task_sessions} tugas | Dibuat: {new Date(user.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                      options={[
                        { value: "FREE", label: "FREE" },
                        { value: "PREMIUM", label: "PREMIUM" },
                      ]}
                      value={user.subscription_tier}
                      onChange={(e) =>
                        handleUpdateTier(user.id, e.target.value as SubscriptionTier)
                      }
                      className="w-32"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetPassword(user.id)}
                    >
                      Reset Password
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(user.id)}
                    >
                      Hapus
                    </Button>
                  </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Buat akun pengguna baru untuk aplikasi NugAI
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 karakter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                options={[
                  { value: "USER", label: "Student" },
                  { value: "ADMIN", label: "Admin" },
                ]}
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_tier">Subscription Tier</Label>
              <Select
                id="subscription_tier"
                options={[
                  { value: "FREE", label: "FREE (5 tasks/day)" },
                  { value: "PREMIUM", label: "PREMIUM (Unlimited)" },
                ]}
                value={subscriptionTier}
                onChange={(e) =>
                  setSubscriptionTier(e.target.value as SubscriptionTier)
                }
              />
            </div>

            {role === "USER" && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">Data Student (Wajib)</p>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Nama Lengkap</Label>
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nim">NIM</Label>
                  <Input
                    id="nim"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="Nomor Induk Mahasiswa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university_name">Universitas</Label>
                  <Input
                    id="university_name"
                    value={universityName}
                    onChange={(e) => setUniversityName(e.target.value)}
                    placeholder="Nama universitas"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faculty">Fakultas</Label>
                  <Input
                    id="faculty"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    placeholder="Nama fakultas"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="study_program">Program Studi</Label>
                  <Input
                    id="study_program"
                    value={studyProgram}
                    onChange={(e) => setStudyProgram(e.target.value)}
                    placeholder="Nama program studi"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}