"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SubscriptionTier, UserRole } from "@prisma/client"
import { Crown, User, Trash2, KeyRound } from "lucide-react"

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
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")
  
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
        setIsCreateDialogOpen(false)
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

  const openResetPasswordDialog = (user: User) => {
    setSelectedUser(user)
    setNewPassword("")
    setIsResetPasswordDialogOpen(true)
  }

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 8) {
      toast.error("Password minimal 8 karakter")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          password: newPassword,
        }),
      })

      if (response.ok) {
        setIsResetPasswordDialogOpen(false)
        setSelectedUser(null)
        setNewPassword("")
        toast.success("Password berhasil direset")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal reset password")
      }
    } catch (error) {
      console.error("Failed to reset password:", error)
      toast.error("Gagal reset password")
    } finally {
      setIsSaving(false)
    }
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setIsDeleteDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
        toast.success("Pengguna berhasil dihapus")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal menghapus pengguna")
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast.error("Gagal menghapus pengguna")
    } finally {
      setIsSaving(false)
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
    setIsCreateDialogOpen(true)
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
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <User className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-slate-500">Belum ada pengguna terdaftar.</p>
            <p className="text-slate-400 mt-2">Tambahkan pengguna untuk mulai menggunakan aplikasi.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4 px-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 shrink-0">
                    {user.role === "ADMIN" ? (
                      <Crown className="w-5 h-5 text-amber-600" />
                    ) : (
                      <User className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{user.username}</p>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          user.subscription_tier === "PREMIUM"
                            ? "text-amber-700 bg-amber-100"
                            : "text-slate-600 bg-slate-100"
                        }`}
                      >
                        {user.subscription_tier}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          user.role === "ADMIN"
                            ? "text-purple-700 bg-purple-100"
                            : "text-emerald-700 bg-emerald-100"
                        }`}
                      >
                        {user.role === "ADMIN" ? "Admin" : "Student"}
                      </span>
                    </div>
                    {user.student_profile && (
                      <p className="text-sm text-slate-600 mt-1">
                        {user.student_profile.full_name} • {user.student_profile.nim}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {user._count.task_sessions} tugas • {new Date(user.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleUpdateTier(user.id, user.subscription_tier === "FREE" ? "PREMIUM" : "FREE")}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                        user.subscription_tier === "PREMIUM" ? "bg-amber-500" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          user.subscription_tier === "PREMIUM" ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                    <span className={cn(
                      "text-xs font-medium",
                      user.subscription_tier === "PREMIUM" ? "text-amber-600" : "text-slate-500"
                    )}>
                      {user.subscription_tier}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openResetPasswordDialog(user)}
                      className="gap-1"
                    >
                      <KeyRound className="w-4 h-4" />
                      Reset
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                      onClick={() => openDeleteDialog(user)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                <p className="text-sm font-medium text-slate-700">Data Student (Wajib)</p>

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

            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Masukkan password baru untuk {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">Password Baru</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 karakter"
              />
              <p className="text-xs text-slate-500">Minimal 8 karakter</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleResetPassword} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Pengguna</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengguna <strong>{selectedUser?.username}</strong>? 
              Semua data tugas pengguna ini juga akan dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
            >
              {isSaving ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}