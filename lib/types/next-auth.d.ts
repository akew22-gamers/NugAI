import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    username: string
    name: string
    role: "ADMIN" | "USER"
    subscriptionTier: "FREE" | "PREMIUM"
  }
  
  interface Session {
    user: User
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    username: string
    name: string
    role: string
    subscriptionTier: string
  }
}
