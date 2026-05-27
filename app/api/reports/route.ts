import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMIN", "WARDEN"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const type = searchParams.get("type") || "revenue"
        const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))

        if (type === "revenue") {
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
            const data = await Promise.all(
                months.slice(0, month).map(async (m) => {
                    const fees = await prisma.fee.aggregate({ where: { month: m, year }, _sum: { paid: true, totalAmount: true } })
                    return { month: m.slice(0, 3), collected: fees._sum.paid || 0, total: fees._sum.totalAmount || 0 }
                })
            )
            const totals = await prisma.fee.aggregate({ where: { year }, _sum: { paid: true, totalAmount: true, due: true } })
            return NextResponse.json({ data, totals: totals._sum })
        }

        if (type === "occupancy") {
            const [total, available, occupied, maintenance] = await Promise.all([
                prisma.room.count(),
                prisma.room.count({ where: { status: "AVAILABLE" } }),
                prisma.room.count({ where: { status: "OCCUPIED" } }),
                prisma.room.count({ where: { status: "MAINTENANCE" } }),
            ])
            const byBlock = await prisma.room.groupBy({ by: ["block"], _count: { id: true }, _sum: { capacity: true, occupied: true } })
            return NextResponse.json({ total, available, occupied, maintenance, byBlock })
        }

        if (type === "complaints") {
            const byCategory = await prisma.complaint.groupBy({ by: ["category"], _count: { id: true } })
            const byStatus = await prisma.complaint.groupBy({ by: ["status"], _count: { id: true } })
            const total = await prisma.complaint.count()
            const resolved = await prisma.complaint.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } })
            return NextResponse.json({ byCategory, byStatus, total, resolved })
        }

        if (type === "fees-summary") {
            const byStatus = await prisma.fee.groupBy({ by: ["status"], _count: { id: true }, _sum: { totalAmount: true, paid: true, due: true } })
            const thisMonth = await prisma.fee.aggregate({
                where: { month: new Date().toLocaleString("default", { month: "long" }), year: new Date().getFullYear() },
                _sum: { totalAmount: true, paid: true, due: true },
            })
            return NextResponse.json({ byStatus, thisMonth: thisMonth._sum })
        }

        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    } catch (error) {
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
    }
}
