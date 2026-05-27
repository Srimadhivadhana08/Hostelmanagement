import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const userId = (searchParams.get("userId") || session.user.id) as string
        const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))

        // Students can only view their own attendance
        if (session.user?.role === "STUDENT" && userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)

        const records = await prisma.attendance.findMany({
            where: { userId, date: { gte: startDate, lte: endDate } },
            orderBy: { date: "asc" },
        })

        const hasData = records.length > 0
        const present = records.filter(r => r.status === "PRESENT" || r.status === "LATE").length
        const absent = records.filter(r => r.status === "ABSENT").length
        const leave = records.filter(r => r.status === "LEAVE").length
        const holiday = records.filter(r => r.status === "HOLIDAY").length
        const total = records.filter(r => r.status !== "HOLIDAY").length
        // If no data yet, return 0 not 100 (avoids misleading 100% attendance)
        const percentage = hasData && total > 0 ? Math.round((present / total) * 100) : 0

        return NextResponse.json({
            records,
            stats: { present, absent, leave, holiday, total, percentage, hasData },
        })
    } catch (error) {
        console.error("[ATTENDANCE STATS GET]", error)
        return NextResponse.json({ error: "Failed to fetch attendance stats" }, { status: 500 })
    }
}
