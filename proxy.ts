import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const user = req.auth?.user

  const isPublicRoute = [
    "/",
    "/login",
    "/onboarding",
    "/api/auth",
  ].some(route => nextUrl.pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  const isAdmin = user?.role === "ADMIN"
  const isAdminRoute = nextUrl.pathname.startsWith("/admin")
  const isStudentRoute = [
    "/dashboard",
    "/task",
    "/courses",
    "/settings",
  ].some(route => nextUrl.pathname.startsWith(route))

  if (isAdmin) {
    if (isStudentRoute) {
      return NextResponse.redirect(new URL("/admin", nextUrl))
    }
    return NextResponse.next()
  }

  if (isAdminRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
}