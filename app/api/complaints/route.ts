import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status")
        const category = searchParams.get("category")
        const priority = searchParams.get("priority")
        const userId = searchParams.get("userId")
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}
        // Students can only see their own complaints
        if (session.user?.role === "STUDENT") where.userId = session.user.id
        else if (userId) where.userId = userId
        
        // Admins (HOD) only see complaints from their department students
        if (session.user?.role === "ADMIN" && session.user.department) {
            where.user = { department: session.user.department }
        }
        if (status) where.status = status
        if (category) where.category = category
        if (priority) where.priority = priority

        const [complaints, total] = await Promise.all([
            prisma.complaint.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { user: { select: { id: true, name: true, email: true, phone: true, room: { select: { roomNumber: true, block: true } } } } },
            }),
            prisma.complaint.count({ where }),
        ])

        return NextResponse.json({ complaints, total, page, totalPages: Math.ceil(total / limit) })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const { title, description, category, priority } = body
        if (!title || !description || !category) {
            return NextResponse.json({ error: "Title, description, and category are required" }, { status: 400 })
        }

        const complaint = await prisma.complaint.create({
            data: { userId: session.user.id as string, title, description, category, priority: priority || "MEDIUM" },
            include: { user: { select: { name: true, email: true } } },
        })

        return NextResponse.json({ complaint }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Failed to create complaint" }, { status: 500 })
    }
}
