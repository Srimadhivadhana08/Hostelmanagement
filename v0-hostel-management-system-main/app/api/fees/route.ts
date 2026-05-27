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
        const month = searchParams.get("month")
        const year = searchParams.get("year")
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}
        if (session.user?.role === "STUDENT") where.userId = session.user.id
        else if (userId) where.userId = userId
        if (status) where.status = status
        if (month) where.month = month
        if (year) where.year = parseInt(year)

        const [fees, total] = await Promise.all([
            prisma.fee.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ year: "desc" }, { month: "desc" }],
                include: { user: { select: { id: true, name: true, email: true, room: { select: { roomNumber: true } } } } },
            }),
            prisma.fee.count({ where }),
        ])

        return NextResponse.json({ fees, total, page, totalPages: Math.ceil(total / limit) })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch fees" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const body = await req.json()
        const { userId, month, year, roomRent, messCharges, otherCharges } = body
        if (!userId || !month || !year || roomRent === undefined) {
            return NextResponse.json({ error: "userId, month, year, and roomRent are required" }, { status: 400 })
        }
        const total = (roomRent || 0) + (messCharges || 0) + (otherCharges || 0)
        const fee = await prisma.fee.create({
            data: { userId, month, year: parseInt(year), roomRent, messCharges: messCharges || 0, otherCharges: otherCharges || 0, totalAmount: total, paid: 0, due: total },
        })
        return NextResponse.json({ fee }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Failed to create fee" }, { status: 500 })
    }
}
