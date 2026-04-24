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
import { Crown, User, Trash2, KeyRound, Pencil, RotateCcw } from "lucide-react"
import { LoadingAdmin } from "@/components/ui/loading"
import Link from "next/link"

interface User {
  id: string
  username: string
  role: UserRole
  subscription_tier: SubscriptionTier
  weekly_usage_count: number
  week_start_date: string | null
  premium_started_at: string | null
  premium_expires_at: string | null
  premium_duration_months: number | null
  premium_is_lifetime: boolean
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")
  
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("USER")
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("FREE")

  const [editUser, setEditUser] = useState<User | null>(null)
  const [editUsername, setEditUsername] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editSubscriptionTier, setEditSubscriptionTier] = useState<SubscriptionTier>("FREE")

  const [premiumUser, setPremiumUser] = useState<User | null>(null)
  const [premiumDuration, setPremiumDuration] = useState<string>("1")
  const [premiumIsLifetime, setPremiumIsLifetime] = useState(false)

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

  const handleToggleTier = (user: User) => {
    if (user.subscription_tier === "PREMIUM") {
      handleDowngradeToFree(user.id)
    } else {
      openPremiumDialog(user)
    }
  }

  const openPremiumDialog = (user: User) => {
    setPremiumUser(user)
    setPremiumDuration("1")
    setPremiumIsLifetime(false)
    setIsPremiumDialogOpen(true)
  }

  const handleUpgradeToPremium = async () => {
    if (!premiumUser) return

    setIsSaving(true)
    try {
      const body: Record<string, unknown> = {
        id: premiumUser.id,
        subscription_tier: "PREMIUM",
        premium_is_lifetime: premiumIsLifetime,
      }

      if (!premiumIsLifetime) {
        const months = parseInt(premiumDuration)
        if (isNaN(months) || months < 1) {
          toast.error("Durasi harus minimal 1 bulan")
          setIsSaving(false)
          return
        }
        body.premium_duration_months = months
      }

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setIsPremiumDialogOpen(false)
        setPremiumUser(null)
        fetchUsers()
        toast.success(premiumIsLifetime
          ? "User berhasil diupgrade ke Premium Lifetime"
          : `User berhasil diupgrade ke Premium (${premiumDuration} bulan)`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal mengupgrade subscription")
      }
    } catch (error) {
      console.error("Failed to upgrade tier:", error)
      toast.error("Gagal mengupgrade subscription")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDowngradeToFree = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          subscription_tier: "FREE",
        }),
      })

      if (response.ok) {
        fetchUsers()
        toast.success("Subscription berhasil diubah ke FREE")
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

  const handleResetLimit = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-limit`, { method: "POST" })
      if (response.ok) {
        fetchUsers()
        toast.success("Limit mingguan berhasil direset")
      } else {
        toast.error("Gagal mereset limit")
      }
    } catch { toast.error("Gagal mereset limit") }
  }

  const resetForm = () => {
    setUsername("")
    setPassword("")
    setRole("USER")
    setSubscriptionTier("FREE")
  }

  const openEditDialog = (user: User) => {
    setEditUser(user)
    setEditUsername(user.username)
    setEditPassword("")
    setEditSubscriptionTier(user.subscription_tier)
    setIsEditDialogOpen(true)
  }

  const handleEditUser = async () => {
    if (!editUser) return
    if (!editUsername || editUsername.length < 3) {
      toast.error("Username minimal 3 karakter")
      return
    }
    if (editPassword && editPassword.length < 8) {
      toast.error("Password minimal 8 karakter")
      return
    }

    setIsSaving(true)
    try {
      const body: Record<string, unknown> = {
        id: editUser.id,
        username: editUsername,
        subscription_tier: editSubscriptionTier,
      }
      if (editPassword) body.password = editPassword

      if (editSubscriptionTier === "PREMIUM" && editUser.subscription_tier === "FREE") {
        body.premium_duration_months = 1
        body.premium_is_lifetime = false
      } else if (editSubscriptionTier === "FREE") {
        body.premium_is_lifetime = false
      }

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        setEditUser(null)
        fetchUsers()
        toast.success("Pengguna berhasil diperbarui")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal memperbarui pengguna")
      }
    } catch (error) {
      console.error("Failed to edit user:", error)
      toast.error("Gagal memperbarui pengguna")
    } finally {
      setIsSaving(false)
    }
  }

  const openNewUserDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const formatPremiumStatus = (user: User) => {
    if (user.subscription_tier !== "PREMIUM") return null
    if (user.premium_is_lifetime) return "Lifetime"
    if (user.premium_expires_at) {
      const expires = new Date(user.premium_expires_at)
      const now = new Date()
      const diffDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays <= 0) return "Expired"
      if (diffDays <= 7) return `${diffDays} hari lagi`
      return `s/d ${expires.toLocaleDateString("id-ID")}`
    }
    return null
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
        <LoadingAdmin text="Memuat pengguna..." />
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
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 shrink-0">
                      {user.role === "ADMIN" ? (
                        <Crown className="w-5 h-5 text-amber-600" />
                      ) : (
                        <User className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    
                    <Link href={`/admin/users/${user.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                      <div className="flex items-center gap-2 flex-wrap">
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
                        {user.subscription_tier === "PREMIUM" && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-100">
                            {formatPremiumStatus(user)}
                          </span>
                        )}
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            user.role === "ADMIN"
                              ? "text-red-700 bg-red-100"
                              : "text-orange-700 bg-orange-100"
                          }`}
                        >
                          {user.role === "ADMIN" ? "Admin" : "Student"}
                        </span>
                      </div>
                      {user.student_profile && (
                        <p className="text-sm text-slate-600 mt-1 truncate">
                          {user.student_profile.full_name} • {user.student_profile.nim}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {user._count.task_sessions} tugas • {new Date(user.created_at).toLocaleDateString("id-ID")}
                        {user.subscription_tier === "FREE" && ` • Minggu ini: ${user.weekly_usage_count}/3`}
                      </p>
                    </Link>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleToggleTier(user)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shrink-0",
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
                      "text-xs font-medium shrink-0",
                      user.subscription_tier === "PREMIUM" ? "text-amber-600" : "text-slate-500"
                    )}>
                      {user.subscription_tier}
                    </span>
                    <div className="flex-1" />
                    
                    {user.subscription_tier === "FREE" && user.weekly_usage_count > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetLimit(user.id)}
                        className="gap-1 shrink-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden sm:inline">Reset</span>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                      className="gap-1 shrink-0"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openResetPasswordDialog(user)}
                      className="gap-1 shrink-0"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span className="hidden sm:inline">Reset</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
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
                  { value: "FREE", label: "FREE (3 tasks/minggu)" },
                  { value: "PREMIUM", label: "PREMIUM (Unlimited)" },
                ]}
                value={subscriptionTier}
                onChange={(e) =>
                  setSubscriptionTier(e.target.value as SubscriptionTier)
                }
              />
            </div>

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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Perbarui data pengguna {editUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_username">Username</Label>
              <Input
                id="edit_username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Username (min 3 karakter)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_password">Password Baru</Label>
              <Input
                id="edit_password"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Kosongkan jika tidak diubah"
              />
              <p className="text-xs text-slate-500">Kosongkan jika tidak ingin mengubah password</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_tier">Subscription Tier</Label>
              <Select
                id="edit_tier"
                options={[
                  { value: "FREE", label: "FREE (3 tasks/minggu)" },
                  { value: "PREMIUM", label: "PREMIUM (Unlimited)" },
                ]}
                value={editSubscriptionTier}
                onChange={(e) => setEditSubscriptionTier(e.target.value as SubscriptionTier)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditUser} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPremiumDialogOpen} onOpenChange={setIsPremiumDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Upgrade ke Premium</DialogTitle>
            <DialogDescription>
              Atur durasi langganan Premium untuk <strong>{premiumUser?.username}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="premium_lifetime"
                checked={premiumIsLifetime}
                onChange={(e) => setPremiumIsLifetime(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <Label htmlFor="premium_lifetime" className="cursor-pointer">
                Lifetime (tanpa batas waktu)
              </Label>
            </div>

            {!premiumIsLifetime && (
              <div className="space-y-2">
                <Label htmlFor="premium_duration">Durasi (bulan)</Label>
                <Input
                  id="premium_duration"
                  type="number"
                  min="1"
                  max="120"
                  value={premiumDuration}
                  onChange={(e) => setPremiumDuration(e.target.value)}
                  placeholder="Masukkan jumlah bulan"
                />
                <p className="text-xs text-slate-500">
                  Langganan akan berakhir pada{" "}
                  <strong>
                    {(() => {
                      const months = parseInt(premiumDuration)
                      if (isNaN(months) || months < 1) return "-"
                      const d = new Date()
                      d.setMonth(d.getMonth() + months)
                      return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                    })()}
                  </strong>
                </p>
              </div>
            )}

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800 font-medium">
                {premiumIsLifetime
                  ? "✨ User akan mendapat akses Premium tanpa batas waktu."
                  : `📅 User akan mendapat akses Premium selama ${premiumDuration || 0} bulan. Setelah habis, otomatis kembali ke FREE.`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPremiumDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleUpgradeToPremium}
              disabled={isSaving || (!premiumIsLifetime && (!premiumDuration || parseInt(premiumDuration) < 1))}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSaving ? "Memproses..." : "Upgrade Premium"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
