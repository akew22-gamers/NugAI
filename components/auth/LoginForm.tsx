"use client"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { update } = useSession()
  const isAdminLogin = searchParams.get("admin") === "true"

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false
      })

      if (result?.error) {
        if (result.error === "Account locked. Try again later.") {
          toast.error("Akun dikunci", {
            description: "Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit."
          })
        } else {
          toast.error("Login gagal", {
            description: "Username atau password tidak valid"
          })
        }
        setIsLoading(false)
        return
      }

      toast.success("Login berhasil!")
      
      await update()
      
      const redirectPath = isAdminLogin ? "/admin" : "/dashboard"
      router.push(redirectPath)
      router.refresh()
    } catch {
      toast.error("Terjadi kesalahan")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isAdminLogin && (
        <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-lg text-sm">
          Mode Login Admin
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Masukkan username"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            required
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? "Memproses..." : "Login"}
      </Button>
    </form>
  )
}

export default function LoginForm() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-full bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-full bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-9 w-full bg-slate-200 rounded animate-pulse" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}