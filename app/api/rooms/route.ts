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
        const type = searchParams.get("type")
        const block = searchParams.get("block")
        const floor = searchParams.get("floor")
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "50")
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}
        if (status) where.status = status
        if (type) where.type = type
        if (block) where.block = block
        if (floor) where.floor = floor

        const [rooms, total] = await Promise.all([
            prisma.room.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ block: "asc" }, { roomNumber: "asc" }],
                include: {
                    students: { select: { id: true, name: true, email: true, phone: true } },
                },
            }),
            prisma.room.count({ where }),
        ])

        return NextResponse.json({ rooms, total, page, totalPages: Math.ceil(total / limit) })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMIN", "WARDEN"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const { roomNumber, type, capacity, price, status, amenities, floor, block } = body

        if (!roomNumber || !price) {
            return NextResponse.json({ error: "Room number and price are required" }, { status: 400 })
        }

        const existing = await prisma.room.findUnique({ where: { roomNumber } })
        if (existing) return NextResponse.json({ error: "Room number already exists" }, { status: 409 })

        const room = await prisma.room.create({
            data: { roomNumber, type: type || "DOUBLE", capacity: capacity || 2, price, status: status || "AVAILABLE", amenities: amenities || [], floor, block },
        })

        return NextResponse.json({ room }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
    }
}
