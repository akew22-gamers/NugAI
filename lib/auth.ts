import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string }
        })

        if (!user || !user.password) {
          return null
        }

        if (user.role === "ADMIN" && user.admin_login_locked_until) {
          if (new Date() < user.admin_login_locked_until) {
            throw new Error("Account locked. Try again later.")
          }
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          if (user.role === "ADMIN") {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                admin_login_attempts: { increment: 1 },
                admin_login_locked_until: 
                  user.admin_login_attempts >= 4 
                    ? new Date(Date.now() + 15 * 60 * 1000)
                    : null
              }
            })
          }
          return null
        }

        if (user.role === "ADMIN") {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              admin_login_attempts: 0,
              admin_login_locked_until: null
            }
          })
        }

        return {
          id: user.id,
          username: user.username,
          role: user.role,
          subscriptionTier: user.subscription_tier
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.subscriptionTier = user.subscriptionTier
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as "ADMIN" | "USER"
        session.user.subscriptionTier = token.subscriptionTier as "FREE" | "PREMIUM"
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  }
})
