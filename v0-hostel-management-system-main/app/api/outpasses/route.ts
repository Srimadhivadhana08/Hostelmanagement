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
        const userId = searchParams.get("userId")
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}

        // Students can only see their own outpasses
        if (session.user?.role === "STUDENT") {
            where.userId = session.user.id
        } else if (userId) {
            where.userId = userId
        }

        // HOD/ADMIN sees outpasses for their department students
        if (session.user?.role === "ADMIN" && session.user.department) {
            where.user = { department: session.user.department }
        }

        if (status) where.status = status

        const [outpasses, total] = await Promise.all([
            prisma.outpass.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            department: true,
                            room: { select: { roomNumber: true, block: true } }
                        }
                    }
                },
            }),
            prisma.outpass.count({ where }),
        ])

        return NextResponse.json({ outpasses, total, page, totalPages: Math.ceil(total / limit) })
    } catch (error) {
        console.error("[OUTPASS GET]", error)
        return NextResponse.json({ error: "Failed to fetch outpasses" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // Only students can apply for leave/outpass
        if (session.user?.role !== "STUDENT") {
            return NextResponse.json({ error: "Only students can apply for leave" }, { status: 403 })
        }

        const body = await req.json()
        const { reason, destination, fromDate, toDate } = body

        if (!reason || !destination || !fromDate || !toDate) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 })
        }

        if (new Date(fromDate) > new Date(toDate)) {
            return NextResponse.json({ error: "From date must be before To date" }, { status: 400 })
        }

        const outpass = await prisma.outpass.create({
            data: {
                userId: session.user.id as string,
                reason,
                destination,
                fromDate: new Date(fromDate),
                toDate: new Date(toDate),
                status: "PENDING",
            },
            include: { user: { select: { name: true, email: true } } },
        })

        return NextResponse.json({ outpass }, { status: 201 })
    } catch (error) {
        console.error("[OUTPASS POST]", error)
        return NextResponse.json({ error: "Failed to create outpass" }, { status: 500 })
    }
}
