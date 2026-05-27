import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const [total, available, occupied, maintenance, reserved] = await Promise.all([
            prisma.room.count(),
            prisma.room.count({ where: { status: "AVAILABLE" } }),
            prisma.room.count({ where: { status: "OCCUPIED" } }),
            prisma.room.count({ where: { status: "MAINTENANCE" } }),
            prisma.room.count({ where: { status: "RESERVED" } }),
        ])

        const byType = await prisma.room.groupBy({
            by: ["type"],
            _count: { id: true },
            _sum: { occupied: true, capacity: true },
        })

        const byBlock = await prisma.room.groupBy({
            by: ["block"],
            _count: { id: true },
            _sum: { occupied: true, capacity: true },
        })

        const totalCapacity = await prisma.room.aggregate({ _sum: { capacity: true, occupied: true } })
        const occupancyRate = totalCapacity._sum.capacity
            ? Math.round(((totalCapacity._sum.occupied || 0) / totalCapacity._sum.capacity) * 100)
            : 0

        return NextResponse.json({ total, available, occupied, maintenance, reserved, byType, byBlock, occupancyRate })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch occupancy stats" }, { status: 500 })
    }
}
