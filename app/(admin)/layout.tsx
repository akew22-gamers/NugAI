import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { InactivityGuard } from "@/components/layout/InactivityGuard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <InactivityGuard timeoutMinutes={30}>
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100">
        <Sidebar />
        <MobileNav />
        <main className="lg:ml-64 min-h-screen flex flex-col">
          <div className="p-4 lg:p-8 flex-1 flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </InactivityGuard>
  )
}
