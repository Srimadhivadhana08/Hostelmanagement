import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const { token } = req.nextauth

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const role = token.role as string

    // Protect admin routes
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Protect warden routes
    if (pathname.startsWith("/warden") && !["ADMIN", "WARDEN"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Protect student routes
    if (pathname.startsWith("/student") && role !== "STUDENT") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        if (!token) return false
        return true
      }
    }
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/warden/:path*",
    "/student/:path*",
    "/dashboard/:path*"
  ]
}