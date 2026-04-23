"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  children?: NavItem[]
}

const studentNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: "Tugas",
    href: "/task",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    children: [
      {
        label: "Diskusi",
        href: "/task/diskusi/new",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
      },
      {
        label: "Soal",
        href: "/task/soal/new",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Riwayat Tugas",
    href: "/task",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Mata Kuliah",
    href: "/courses",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    label: "Pengaturan",
    href: "/settings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const adminNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: "Pengguna",
    href: "/admin/users",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: "Provider AI",
    href: "/admin/providers",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Search API",
    href: "/admin/search-providers",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    label: "Analitik",
    href: "/admin/analytics",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

const CrownIcon = (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19A1 1 0 0018 20H6A1 1 0 005 19V18H19V19Z" />
  </svg>
)

const ShieldIcon = (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 1L3 5v11c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
  </svg>
)

const LogoutIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
)

export function Sidebar() {
  const pathname = usePathname()
  const { data: session, status, update } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.id) {
      update()
    }
  }, [status, session, update])

  const username = session?.user?.username ?? "User"
  const role = session?.user?.role ?? "USER"
  const subscriptionTier = session?.user?.subscriptionTier ?? "FREE"
  const isAdmin = role === "ADMIN"
  const isPremium = subscriptionTier === "PREMIUM"
  const navItems = isAdmin ? adminNavItems : studentNavItems

  const handleLogout = () => {
    import("next-auth/react").then(({ signOut }) => {
      signOut({ callbackUrl: "/login" })
    })
  }

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  const getIsActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    if (href === "/task/diskusi/new") return pathname?.startsWith("/task/diskusi") ?? false
    if (href === "/task/soal/new") return pathname?.startsWith("/task/soal") ?? false
    return pathname === href
  }

  const isParentActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some(child => getIsActive(child.href))
    }
    return getIsActive(item.href)
  }

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  useEffect(() => {
    navItems.forEach(item => {
      if (item.children && isParentActive(item) && !expandedMenus.includes(item.label)) {
        setExpandedMenus(prev => [...prev, item.label])
      }
    })
  }, [pathname])

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-white border-r border-zinc-200 transition-all duration-300 z-40",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-6 border-b border-zinc-100">
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2">
          {!isCollapsed && (
            <span className="font-bold text-xl">
              <span className="text-slate-900">Nug</span>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: isAdmin
                    ? "linear-gradient(135deg, #ef4444 0%, #f97316 50%, #f59e0b 100%)"
                    : "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
                }}
              >
                AI
              </span>
            </span>
          )}
          {isCollapsed && (
            <span className="font-bold text-lg">
              <span className="text-slate-900">N</span>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: isAdmin
                    ? "linear-gradient(135deg, #ef4444 0%, #f97316 50%, #f59e0b 100%)"
                    : "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
                }}
              >
                AI
              </span>
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          if (item.children) {
            const parentActive = isParentActive(item)
            const isExpanded = expandedMenus.includes(item.label)

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full text-left",
                    parentActive
                      ? isAdmin ? "text-red-700 font-medium" : "text-purple-700 font-medium"
                      : "text-slate-600 hover:bg-zinc-50 hover:text-slate-900"
                  )}
                >
                  <span className={cn("shrink-0 transition-colors", parentActive ? isAdmin ? "text-red-600" : "text-purple-600" : "text-slate-400 group-hover:text-slate-600")}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      <svg className={cn("w-4 h-4 transition-transform duration-200 text-slate-400", isExpanded && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                {isExpanded && !isCollapsed && (
                  <div className="ml-4 pl-3 border-l border-zinc-200 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const childActive = getIsActive(child.href)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm group",
                            childActive
                              ? isAdmin ? "bg-red-50 text-red-700 font-medium" : "bg-purple-50 text-purple-700 font-medium"
                              : "text-slate-500 hover:bg-zinc-50 hover:text-slate-900"
                          )}
                        >
                          <span className={cn("shrink-0", childActive ? isAdmin ? "text-red-500" : "text-purple-500" : "text-slate-400 group-hover:text-slate-500")}>
                            {child.icon}
                          </span>
                          <span>{child.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const isActive = getIsActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? isAdmin 
                    ? "bg-red-50 text-red-700 font-medium"
                    : "bg-purple-50 text-purple-700 font-medium"
                  : "text-slate-600 hover:bg-zinc-50 hover:text-slate-900"
              )}
            >
              <span
                className={cn(
                  "shrink-0 transition-colors",
                  isActive 
                    ? isAdmin ? "text-red-600" : "text-purple-600"
                    : "text-slate-400 group-hover:text-slate-600"
                )}
              >
                {item.icon}
              </span>
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-zinc-100 space-y-3">
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200",
            isCollapsed && "justify-center"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
            isAdmin
              ? "bg-gradient-to-br from-red-500 to-orange-600"
              : "bg-gradient-to-br from-slate-700 to-slate-900"
          )}>
            <span className="text-white font-semibold text-sm">
              {getInitials(username)}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{username}</p>
              <div className="flex items-center gap-1.5">
                {isAdmin ? (
                  <>
                    <span className="text-red-600">{ShieldIcon}</span>
                    <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                      ADMIN
                    </span>
                  </>
                ) : isPremium ? (
                  <>
                    <span className="text-amber-600">{CrownIcon}</span>
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      PREMIUM
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    FREE
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "default"}
          onClick={handleLogout}
          className={cn(
            "w-full text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors",
            isCollapsed && "h-10 w-10"
          )}
        >
          <span className="shrink-0">{LogoutIcon}</span>
          {!isCollapsed && <span>Keluar</span>}
        </Button>
      </div>
    </aside>
  )
}
