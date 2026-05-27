import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: "ADMIN" | "WARDEN" | "STUDENT"
      department?: string | null
      year?: number | null
    }
  }

  interface User {
    role: "ADMIN" | "WARDEN" | "STUDENT"
    id: string
    department?: string | null
    year?: number | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "WARDEN" | "STUDENT"
    id: string
    department?: string | null
    year?: number | null
  }
}