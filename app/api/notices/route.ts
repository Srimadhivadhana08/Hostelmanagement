import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const category = searchParams.get("category")
        const priority = searchParams.get("priority")
        const active = searchParams.get("active") !== "false"
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const search = searchParams.get("search") || ""
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = { isActive: active }
        if (category) where.category = category
        if (priority) where.priority = priority
        if (search) where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
        ]

        const [notices, total] = await Promise.all([
            prisma.notice.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
            }),
            prisma.notice.count({ where }),
        ])

        return NextResponse.json({ notices, total, page, totalPages: Math.ceil(total / limit) })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMIN", "WARDEN"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const body = await req.json()
        const { title, content, category, priority, expiresAt } = body
        if (!title || !content) return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
        const notice = await prisma.notice.create({
            data: {
                title,
                content,
                category: category || "GENERAL",
                priority: priority || "MEDIUM",
                postedBy: session.user.id as string,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                isActive: true,
            },
        })
        return NextResponse.json({ notice }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Failed to create notice" }, { status: 500 })
    }
}
