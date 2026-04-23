import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { InactivityGuard } from "@/components/layout/InactivityGuard"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <InactivityGuard timeoutMinutes={20}>
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100">
        <Sidebar />
        <MobileNav />
        <main className="lg:ml-64 min-h-screen">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </InactivityGuard>
  )
}
