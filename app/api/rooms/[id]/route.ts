import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        const { id } = await props.params
        const room = await prisma.room.findUnique({
            where: { id },
            include: { students: { select: { id: true, name: true, email: true, phone: true, avatar: true } }, bookings: { orderBy: { createdAt: "desc" }, take: 5 } },
        })
        if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 })
        return NextResponse.json({ room })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMIN", "WARDEN"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const { id } = await props.params
        const body = await req.json()
        const { price, amenities, status, capacity, floor, block, occupied } = body
        const updateData: Record<string, unknown> = {}
        if (price !== undefined) updateData.price = price
        if (amenities !== undefined) updateData.amenities = amenities
        if (status !== undefined) updateData.status = status
        if (capacity !== undefined) updateData.capacity = capacity
        if (floor !== undefined) updateData.floor = floor
        if (block !== undefined) updateData.block = block
        if (occupied !== undefined) updateData.occupied = occupied
        const room = await prisma.room.update({ where: { id }, data: updateData })
        return NextResponse.json({ room })
    } catch (error) {
        return NextResponse.json({ error: "Failed to update room" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        const { id } = await props.params
        const students = await prisma.user.count({ where: { roomId: id, isActive: true } })
        if (students > 0) return NextResponse.json({ error: "Cannot delete room with active students" }, { status: 400 })
        await prisma.room.delete({ where: { id } })
        return NextResponse.json({ message: "Room deleted successfully" })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete room" }, { status: 500 })
    }
}
