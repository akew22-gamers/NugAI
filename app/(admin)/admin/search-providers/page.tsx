"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SearchProviderType } from "@prisma/client"

interface SearchProvider {
  id: string
  provider_type: SearchProviderType
  is_active: boolean
  created_at: Date
  updated_at: Date
}

const SEARCH_PROVIDER_INFO = {
  TAVILY: {
    name: "Tavily",
    description: "API pencarian web yang cepat dan akurat",
    docsUrl: "https://docs.tavily.com",
    icon: (
      <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  EXA: {
    name: "Exa",
    description: "API pencarian neural untuk konten akademik",
    docsUrl: "https://docs.exa.ai",
    icon: (
      <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
}

export default function AdminSearchProvidersPage() {
  const [providers, setProviders] = useState<SearchProvider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)

  const [tavilyApiKey, setTavilyApiKey] = useState("")
  const [tavilyActive, setTavilyActive] = useState(true)
  const [exaApiKey, setExaApiKey] = useState("")
  const [exaActive, setExaActive] = useState(true)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/search-providers")
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers)
        
        const tavilyProvider = data.providers.find(
          (p: SearchProvider) => p.provider_type === "TAVILY"
        )
        const exaProvider = data.providers.find(
          (p: SearchProvider) => p.provider_type === "EXA"
        )
        
        if (tavilyProvider) {
          setTavilyActive(tavilyProvider.is_active)
        }
        if (exaProvider) {
          setExaActive(exaProvider.is_active)
        }
      }
    } catch (error) {
      console.error("Failed to fetch search providers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTavily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tavilyApiKey) {
      toast.error("API Key harus diisi")
      return
    }

    setIsSaving("TAVILY")
    try {
      const response = await fetch("/api/admin/search-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_type: "TAVILY",
          api_key: tavilyApiKey,
          is_active: tavilyActive,
        }),
      })

      if (response.ok) {
        setTavilyApiKey("")
        fetchProviders()
        toast.success("Tavily berhasil dikonfigurasi")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal menyimpan Tavily")
      }
    } catch (error) {
      console.error("Failed to save Tavily:", error)
      toast.error("Gagal menyimpan Tavily")
    } finally {
      setIsSaving(null)
    }
  }

  const handleSaveExa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!exaApiKey) {
      toast.error("API Key harus diisi")
      return
    }

    setIsSaving("EXA")
    try {
      const response = await fetch("/api/admin/search-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_type: "EXA",
          api_key: exaApiKey,
          is_active: exaActive,
        }),
      })

      if (response.ok) {
        setExaApiKey("")
        fetchProviders()
        toast.success("Exa berhasil dikonfigurasi")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal menyimpan Exa")
      }
    } catch (error) {
      console.error("Failed to save Exa:", error)
      toast.error("Gagal menyimpan Exa")
    } finally {
      setIsSaving(null)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/search-providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: isActive }),
      })

      if (response.ok) {
        fetchProviders()
        toast.success(isActive ? "Provider berhasil diaktifkan" : "Provider berhasil dinonaktifkan")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal mengubah status")
      }
    } catch (error) {
      console.error("Failed to toggle active:", error)
      toast.error("Gagal mengubah status provider")
    }
  }

  const tavilyProvider = providers.find((p) => p.provider_type === "TAVILY")
  const exaProvider = providers.find((p) => p.provider_type === "EXA")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Search API</h1>
        <p className="text-slate-600 mt-1">
          Kelola API pencarian untuk research tugas
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">
          Memuat search providers...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {SEARCH_PROVIDER_INFO.TAVILY.icon}
                <div>
                  <CardTitle>{SEARCH_PROVIDER_INFO.TAVILY.name}</CardTitle>
                  <CardDescription>
                    {SEARCH_PROVIDER_INFO.TAVILY.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tavilyProvider ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        tavilyProvider.is_active
                          ? "text-green-600 bg-green-50"
                          : "text-red-600 bg-red-50"
                      }`}
                    >
                      {tavilyProvider.is_active ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleActive(tavilyProvider.id, !tavilyProvider.is_active)
                      }
                    >
                      {tavilyProvider.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                    <a
                      href={SEARCH_PROVIDER_INFO.TAVILY.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Dokumentasi
                    </a>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Ganti API Key
                    </p>
                    <form onSubmit={handleSaveTavily} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="tavily_api_key">API Key Baru</Label>
                        <Input
                          id="tavily_api_key"
                          type="password"
                          value={tavilyApiKey}
                          onChange={(e) => setTavilyApiKey(e.target.value)}
                          placeholder="Masukkan API key baru..."
                        />
                        <p className="text-xs text-slate-500">
                          API key tersimpan di server. Masukkan key baru untuk mengganti.
                        </p>
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSaving === "TAVILY" || !tavilyApiKey}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        {isSaving === "TAVILY" ? "Menyimpan..." : "Simpan API Key Baru"}
                      </Button>
                    </form>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveTavily} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tavily_api_key_new">API Key</Label>
                    <Input
                      id="tavily_api_key_new"
                      type="password"
                      value={tavilyApiKey}
                      onChange={(e) => setTavilyApiKey(e.target.value)}
                      placeholder="tvly-xxxxx"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tavily_active"
                      checked={tavilyActive}
                      onChange={(e) => setTavilyActive(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-200"
                    />
                    <Label htmlFor="tavily_active">Aktifkan segera</Label>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      type="submit"
                      disabled={isSaving === "TAVILY" || !tavilyApiKey}
                    >
                      {isSaving === "TAVILY" ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <a
                      href={SEARCH_PROVIDER_INFO.TAVILY.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Dokumentasi
                    </a>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {SEARCH_PROVIDER_INFO.EXA.icon}
                <div>
                  <CardTitle>{SEARCH_PROVIDER_INFO.EXA.name}</CardTitle>
                  <CardDescription>
                    {SEARCH_PROVIDER_INFO.EXA.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {exaProvider ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        exaProvider.is_active
                          ? "text-green-600 bg-green-50"
                          : "text-red-600 bg-red-50"
                      }`}
                    >
                      {exaProvider.is_active ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleActive(exaProvider.id, !exaProvider.is_active)
                      }
                    >
                      {exaProvider.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                    <a
                      href={SEARCH_PROVIDER_INFO.EXA.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Dokumentasi
                    </a>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Ganti API Key
                    </p>
                    <form onSubmit={handleSaveExa} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="exa_api_key">API Key Baru</Label>
                        <Input
                          id="exa_api_key"
                          type="password"
                          value={exaApiKey}
                          onChange={(e) => setExaApiKey(e.target.value)}
                          placeholder="Masukkan API key baru..."
                        />
                        <p className="text-xs text-slate-500">
                          API key tersimpan di server. Masukkan key baru untuk mengganti.
                        </p>
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSaving === "EXA" || !exaApiKey}
                        className="gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        {isSaving === "EXA" ? "Menyimpan..." : "Simpan API Key Baru"}
                      </Button>
                    </form>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveExa} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exa_api_key_new">API Key</Label>
                    <Input
                      id="exa_api_key_new"
                      type="password"
                      value={exaApiKey}
                      onChange={(e) => setExaApiKey(e.target.value)}
                      placeholder="exa-xxxxx"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="exa_active"
                      checked={exaActive}
                      onChange={(e) => setExaActive(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-200"
                    />
                    <Label htmlFor="exa_active">Aktifkan segera</Label>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      type="submit"
                      disabled={isSaving === "EXA" || !exaApiKey}
                    >
                      {isSaving === "EXA" ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <a
                      href={SEARCH_PROVIDER_INFO.EXA.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Dokumentasi
                    </a>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tentang Search API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              Search API digunakan untuk mencari referensi dan sumber ketika
              mengerjakan tugas akademik.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Tavily</strong> - Pencarian web general, cepat dan akurat
              </li>
              <li>
                <strong>Exa</strong> - Pencarian neural untuk konten akademik dan
                jurnal
              </li>
            </ul>
            <p>
              Anda dapat mengaktifkan salah satu atau kedua provider untuk hasil
              pencarian yang lebih lengkap.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}