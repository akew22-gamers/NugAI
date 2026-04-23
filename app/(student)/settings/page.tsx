"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ProfileForm } from "@/components/settings/ProfileForm"
import { PasswordForm } from "@/components/settings/PasswordForm"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [hasIncompleteProfile, setHasIncompleteProfile] = useState(false)

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error("No profile")
      })
      .then((data) => {
        const profile = data.data
        const isComplete = profile?.full_name && profile?.nim && profile?.university_name && profile?.study_program
        setHasIncompleteProfile(!isComplete)
      })
      .catch(() => setHasIncompleteProfile(true))
  }, [])

  return (
    <div className="space-y-6">
      {hasIncompleteProfile && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800 font-medium">Lengkapi profil Anda</p>
          <p className="text-amber-600 text-sm mt-1">Anda harus melengkapi data profil sebelum dapat menggunakan fitur lainnya.</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Pengaturan</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Kelola profil dan keamanan akun Anda
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col items-center">
        <TabsList className="inline-flex h-12">
          <TabsTrigger value="profile" className="gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profil
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Keamanan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 w-full max-w-xl">
          <Card className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <CardContent className="px-6 pt-6 pb-6">
              <ProfileForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 w-full max-w-xl">
          <Card className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <CardContent className="px-6 pt-6 pb-6">
              <PasswordForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}