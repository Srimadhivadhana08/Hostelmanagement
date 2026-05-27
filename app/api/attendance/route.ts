import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const date = searchParams.get("date")
        const userId = searchParams.get("userId")
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "50")
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}
        if (session.user?.role === "STUDENT") where.userId = session.user.id
        else if (userId) where.userId = userId
        if (date) {
            const d = new Date(date)
            d.setHours(0, 0, 0, 0)
            const d2 = new Date(d)
            d2.setHours(23, 59, 59, 999)
            where.date = { gte: d, lte: d2 }
        }

        const [records, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ date: "desc" }],
                include: { user: { select: { id: true, name: true, email: true, room: { select: { roomNumber: true, block: true } } } } },
            }),
            prisma.attendance.count({ where }),
        ])

        return NextResponse.json({ records, total, page, totalPages: Math.ceil(total / limit) })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMIN", "WARDEN"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        // Support bulk mark: { date, records: [{ userId, status, notes }] }
        const { date, records } = body
        if (!date || !records || !Array.isArray(records)) {
            return NextResponse.json({ error: "date and records array are required" }, { status: 400 })
        }

        const attendanceDate = new Date(date)
        attendanceDate.setHours(0, 0, 0, 0)

        const results = await Promise.allSettled(
            records.map(async (r: { userId: string; status: string; notes?: string }) => {
                return prisma.attendance.upsert({
                    where: { userId_date: { userId: r.userId, date: attendanceDate } },
                    update: { status: r.status as "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "HOLIDAY", notes: r.notes, markedBy: session.user.id as string },
                    create: {
                        userId: r.userId,
                        date: attendanceDate,
                        status: r.status as "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "HOLIDAY",
                        notes: r.notes,
                        markedBy: session.user.id as string,
                        checkInTime: r.status === "PRESENT" ? new Date() : undefined,
                    },
                })
            })
        )

        const saved = results.filter(r => r.status === "fulfilled").length
        return NextResponse.json({ message: `Marked attendance for ${saved}/${records.length} students` })
    } catch (error) {
        return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 })
    }
}
