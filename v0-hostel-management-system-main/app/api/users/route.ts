import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role")
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (role) where.role = role
    
    // Admin (HOD) can only see students in their department
    if (session.user?.role === "ADMIN" && session.user.department && role === "STUDENT") {
      where.department = session.user.department
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, email: true, name: true, role: true,
          phone: true, address: true, avatar: true, isActive: true,
          createdAt: true, roomId: true,
          room: { select: { roomNumber: true, block: true, floor: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { email, password, name, role, phone, address, roomId } = body

    const requestedRole = role || "STUDENT"

    // Allow unauthenticated self-registration ONLY for STUDENT role
    if (!session && requestedRole !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    // Admin/Warden role creation requires an admin or warden session
    if (requestedRole !== "STUDENT" && !["ADMIN", "WARDEN"].includes(session?.user?.role as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        role: requestedRole as "ADMIN" | "WARDEN" | "STUDENT",
        isActive: true,
        ...(phone ? { phone: String(phone).trim() } : {}),
        ...(address ? { address: String(address).trim() } : {}),
        ...(roomId ? { roomId: String(roomId) } : {}),
      },
      select: { id: true, email: true, name: true, role: true, phone: true, isActive: true, createdAt: true },
    })

    if (roomId) {
      await prisma.room.update({
        where: { id: String(roomId) },
        data: { occupied: { increment: 1 } },
      }).catch(() => {})
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("User create error:", msg)
    return NextResponse.json({
      error: msg.includes("already exists") || msg.includes("Unique constraint")
        ? "User with this email already exists"
        : "Failed to create user. Please try again.",
    }, { status: 500 })
  }
}