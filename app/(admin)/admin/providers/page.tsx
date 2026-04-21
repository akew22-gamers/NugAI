"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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
import { AIProviderType } from "@prisma/client"
import { cn } from "@/lib/utils"

interface Provider {
  id: string
  provider_type: AIProviderType
  provider_name: string
  base_url: string
  default_model: string
  is_active: boolean
  priority?: number
  available_models?: {
    models: Array<{ id: string; name?: string; owned_by?: string }>
    fetched_at: string
  }
  last_model_fetch?: Date
}

interface Model {
  id: string
  name?: string
  owned_by?: string
}

const PROVIDER_OPTIONS = [
  { value: "DEEPSEEK", label: "DeepSeek" },
  { value: "OPENAI", label: "OpenAI" },
  { value: "GROQ", label: "Groq" },
  { value: "TOGETHER", label: "Together AI" },
  { value: "CUSTOM", label: "Custom" },
]

const PRESET_BASE_URLS: Record<string, string> = {
  DEEPSEEK: "https://api.deepseek.com",
  OPENAI: "https://api.openai.com/v1",
  GROQ: "https://api.groq.com/openai/v1",
  TOGETHER: "https://api.together.xyz/v1",
  CUSTOM: "",
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [isFetchingModels, setIsFetchingModels] = useState(false)
  const [availableModels, setAvailableModels] = useState<Model[]>([])

  const [providerType, setProviderType] = useState<AIProviderType>("DEEPSEEK")
  const [providerName, setProviderName] = useState("")
  const [baseUrl, setBaseUrl] = useState(PRESET_BASE_URLS["DEEPSEEK"])
  const [apiKey, setApiKey] = useState("")
  const [defaultModel, setDefaultModel] = useState("")
  const [priority, setPriority] = useState(0)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/providers")
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers)
      }
    } catch (error) {
      console.error("Failed to fetch providers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderTypeChange = (value: AIProviderType) => {
    setProviderType(value)
    if (value !== "CUSTOM") {
      setBaseUrl(PRESET_BASE_URLS[value])
      setProviderName("")
    } else {
      setBaseUrl("")
      setProviderName("")
    }
    setAvailableModels([])
    setDefaultModel("")
  }

  const handleFetchModels = async () => {
    if (!isEditing && (!baseUrl || !apiKey)) {
      toast.error("Base URL dan API Key harus diisi sebelum fetch model")
      return
    }

    setIsFetchingModels(true)
    try {
      const fetchBody = isEditing && editingProvider
        ? apiKey
          ? { provider_id: editingProvider.id, base_url: baseUrl, api_key: apiKey }
          : { provider_id: editingProvider.id }
        : { base_url: baseUrl, api_key: apiKey }

      const response = await fetch("/api/admin/providers/fetch-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fetchBody),
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableModels(data.models)
        if (data.models.length > 0 && !defaultModel) {
          setDefaultModel(data.models[0].id)
        }
        toast.success(`${data.models.length} model berhasil dimuat`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal fetch model")
      }
    } catch (error) {
      console.error("Failed to fetch models:", error)
      toast.error("Gagal fetch model dari provider")
    } finally {
      setIsFetchingModels(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEditing && !apiKey) {
      toast.error("API Key harus diisi")
      return
    }

    if (providerType === "CUSTOM" && !baseUrl) {
      toast.error("Base URL harus diisi untuk provider custom")
      return
    }

    setIsSaving(true)
    try {
      const url = "/api/admin/providers"
      const method = isEditing ? "PATCH" : "POST"

      const body = isEditing
        ? {
            id: editingProvider?.id,
            provider_name: providerType === "CUSTOM" ? providerName : undefined,
            base_url: providerType === "CUSTOM" ? baseUrl : undefined,
            api_key: apiKey || undefined,
            default_model: defaultModel || undefined,
            priority,
          }
        : {
            provider_type: providerType,
            provider_name: providerType === "CUSTOM" ? providerName : "",
            base_url: baseUrl,
            api_key: apiKey,
            default_model: defaultModel || "",
            priority,
          }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        resetForm()
        fetchProviders()
        toast.success(isEditing ? "Provider berhasil diperbarui" : "Provider berhasil ditambahkan")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal menyimpan provider")
      }
    } catch (error) {
      console.error("Failed to save provider:", error)
      toast.error("Gagal menyimpan provider")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (provider: Provider) => {
    try {
      if (provider.is_active) {
        const otherActiveProvider = providers.find(p => p.is_active && p.id !== provider.id)
        
        if (!otherActiveProvider) {
          toast.error("Minimal harus ada 1 provider aktif")
          return
        }
        
        const response = await fetch("/api/admin/providers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id: provider.id,
            is_active: false 
          }),
        })

        if (response.ok) {
          await fetchProviders()
          toast.success("Provider berhasil dinonaktifkan")
        } else {
          const error = await response.json()
          toast.error(error.error || "Gagal menonaktifkan provider")
        }
      } else {
        const response = await fetch("/api/admin/providers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id: provider.id,
            is_active: true 
          }),
        })

        if (response.ok) {
          await fetchProviders()
          toast.success("Provider berhasil diaktifkan")
        } else {
          const error = await response.json()
          toast.error(error.error || "Gagal mengaktifkan provider")
        }
      }
    } catch (error) {
      console.error("Failed to toggle provider:", error)
      toast.error("Gagal mengubah status provider")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus provider ini?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/providers?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchProviders()
        toast.success("Provider berhasil dihapus")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal menghapus provider")
      }
    } catch (error) {
      console.error("Failed to delete provider:", error)
      toast.error("Gagal menghapus provider")
    }
  }

  const handleEdit = async (provider: Provider) => {
    setIsEditing(true)
    setEditingProvider(provider)
    setProviderType(provider.provider_type)
    setProviderName(provider.provider_name)
    setBaseUrl(provider.base_url)
    setApiKey("")
    setDefaultModel(provider.default_model)
    setPriority(provider.priority || 0)
    
    if (provider.available_models?.models) {
      setAvailableModels(provider.available_models.models)
    }

    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setIsEditing(false)
    setEditingProvider(null)
    setProviderType("DEEPSEEK")
    setProviderName("")
    setBaseUrl(PRESET_BASE_URLS["DEEPSEEK"])
    setApiKey("")
    setDefaultModel("")
    setPriority(0)
    setShowApiKey(false)
    setAvailableModels([])
  }

  const openNewProviderDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const modelOptions = availableModels.map((m) => ({
    value: m.id,
    label: m.name || m.id,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Provider AI</h1>
          <p className="text-slate-600 mt-1">
            Kelola provider AI untuk generasi tugas
          </p>
        </div>
        <Button onClick={openNewProviderDialog}>Tambah Provider</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Memuat provider...</div>
      ) : providers.length === 0 ? (
        <Card className="h-[200px]">
          <CardContent className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-slate-500">Belum ada provider AI yang dikonfigurasi.</p>
            <p className="text-slate-500 mt-2">Tambahkan provider untuk mulai menggunakan AI.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            const sortedProviders = [...providers].sort((a, b) => {
              if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
              return (b.priority || 0) - (a.priority || 0)
            })
            
            return sortedProviders.map((provider) => (
              <Card
                key={provider.id}
                className={cn(
                  "transition-all duration-200",
                  provider.is_active 
                    ? "border-green-500 border-2 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-500/20" 
                    : "hover:shadow-md"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {provider.provider_name}
                        {provider.is_active && (
                          <span className="text-xs font-bold text-white bg-green-600 px-2 py-1 rounded-full">
                            AKTIF
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        {provider.provider_type}
                        {provider.is_active && (
                          <span className="text-xs text-green-700 font-medium">
                            • Primary Provider
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={provider.is_active}
                        onCheckedChange={() => handleToggleActive(provider)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-slate-500">Base URL:</span>
                      <span className="ml-2 text-slate-700 block break-all">{provider.base_url}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-500">Default Model:</span>
                      <span className="ml-2 text-slate-700">
                        {provider.default_model || "Tidak ada"}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-500">Priority:</span>
                      <span className="ml-2 text-slate-700 font-medium">{provider.priority || 0}</span>
                    </div>
                    {provider.last_model_fetch && (
                      <div className="text-sm">
                        <span className="text-slate-500">Model Fetch:</span>
                        <span className="ml-2 text-slate-700">
                          {new Date(provider.last_model_fetch).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(provider)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(provider.id)}
                      >
                        Hapus
                      </Button>
                    </div>
                    
                    {provider.is_active && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <p className="text-xs text-blue-700">
                          <span className="font-semibold">Info:</span> Provider aktif dengan priority tertinggi digunakan pertama. Failover otomatis ke provider berikutnya jika gagal.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          })()}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Provider" : "Tambah Provider AI"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Perbarui konfigurasi provider AI"
                : "Konfigurasi provider AI baru untuk generasi tugas"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider_type">Jenis Provider</Label>
              <Select
                id="provider_type"
                options={PROVIDER_OPTIONS}
                value={providerType}
                onChange={(e) =>
                  handleProviderTypeChange(e.target.value as AIProviderType)
                }
                disabled={isEditing && editingProvider?.provider_type !== "CUSTOM"}
              />
            </div>

            {providerType === "CUSTOM" && (
              <div className="space-y-2">
                <Label htmlFor="provider_name">Nama Provider</Label>
                <Input
                  id="provider_name"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="Nama provider custom"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="base_url">Base URL</Label>
              <Input
                id="base_url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.provider.com/v1"
                disabled={!isEditing && providerType !== "CUSTOM"}
              />
              {!isEditing && providerType !== "CUSTOM" && (
                <p className="text-xs text-slate-500">
                  Base URL otomatis untuk provider preset
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-slate-500">
                  URL yang tersimpan untuk provider ini
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <div className="relative">
                <Input
                  id="api_key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={isEditing ? "Kosongkan jika tidak diubah" : "sk-xxxxx"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showApiKey ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {isEditing && (
                <p className="text-xs text-slate-500">
                  API key tersimpan di server. Kosongkan jika tidak ingin mengubah.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_model">Model Default</Label>
              {availableModels.length > 0 ? (
                <Select
                  id="default_model"
                  options={modelOptions}
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  placeholder="Pilih model default"
                />
              ) : (
                <Input
                  id="default_model"
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  placeholder="Contoh: deepseek-chat, llama-3.3-70b-versatile"
                />
              )}
              {isEditing && defaultModel && (
                <p className="text-xs text-slate-500">
                  Model saat ini: <span className="font-medium text-slate-700">{defaultModel}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={handleFetchModels}
                disabled={isFetchingModels || !baseUrl || (!isEditing && !apiKey)}
              >
                {isFetchingModels ? "Memuat..." : "Fetch Model"}
              </Button>
              {availableModels.length > 0 && (
                <span className="text-sm text-slate-500">
                  {availableModels.length} model tersedia
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                min={0}
                max={100}
                placeholder="0-100 (semakin tinggi = semakin prioritas)"
              />
              <p className="text-xs text-slate-500">
                Provider dengan priority tertinggi akan digunakan pertama saat generate tugas
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : isEditing ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}