import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isAuthPage = nextUrl.pathname.startsWith("/login")
  const isOnboardingPage = nextUrl.pathname.startsWith("/onboarding")
  const isAdminPage = nextUrl.pathname.startsWith("/admin")
  const isStudentPage = nextUrl.pathname.startsWith("/dashboard") || 
                        nextUrl.pathname.startsWith("/task") ||
                        nextUrl.pathname.startsWith("/courses") ||
                        nextUrl.pathname.startsWith("/settings")
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth")
  const isPublicApi = nextUrl.pathname.startsWith("/api/public") ||
                      nextUrl.pathname === "/api/health"

  if (isApiAuth || isPublicApi) {
    return NextResponse.next()
  }

  if (isAuthPage) {
    if (isLoggedIn) {
      const role = req.auth?.user?.role
      const redirectUrl = role === "ADMIN" ? "/admin" : "/dashboard"
      return NextResponse.redirect(new URL(redirectUrl, nextUrl))
    }
    return NextResponse.next()
  }

  if (isAdminPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login?admin=true", nextUrl))
    }
    if (req.auth?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
    return NextResponse.next()
  }

  if (isStudentPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl))
    }
    if (req.auth?.user?.role !== "USER") {
      return NextResponse.redirect(new URL("/admin", nextUrl))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/login/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/task/:path*",
    "/courses/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/api/:path*",
  ],
}