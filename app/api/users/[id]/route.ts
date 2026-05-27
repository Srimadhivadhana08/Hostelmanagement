import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await props.params
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true, email: true, name: true, role: true, department: true, year: true,
                phone: true, address: true, avatar: true, isActive: true,
                createdAt: true, updatedAt: true, roomId: true,
                room: { select: { roomNumber: true, block: true, floor: true, type: true, price: true } },
                bookings: { orderBy: { createdAt: "desc" }, take: 5 },
                fees: { orderBy: { year: "desc" }, take: 6 },
                complaints: { orderBy: { createdAt: "desc" }, take: 5 },
                outpasses: { orderBy: { createdAt: "desc" }, take: 5 },
                attendance: { orderBy: { date: "desc" }, take: 30 },
            },
        })

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
        return NextResponse.json({ user })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await props.params
        const body = await req.json()
        const { name, phone, address, avatar, isActive, password, roomId, department, year } = body

        const updateData: Record<string, unknown> = {}
        if (name !== undefined) updateData.name = name
        if (phone !== undefined) updateData.phone = phone
        if (address !== undefined) updateData.address = address
        if (department !== undefined) updateData.department = department
        if (year !== undefined) updateData.year = year ? parseInt(year as string) || null : null
        if (avatar !== undefined) updateData.avatar = avatar
        if (isActive !== undefined) updateData.isActive = isActive
        if (password) updateData.password = await bcrypt.hash(password, 12)
        if (roomId !== undefined) updateData.roomId = roomId

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, email: true, name: true, role: true, phone: true, isActive: true, updatedAt: true, department: true, year: true },
        })

        return NextResponse.json({ user })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id } = await props.params
        // Soft delete - just mark as inactive
        await prisma.user.update({ where: { id }, data: { isActive: false } })
        return NextResponse.json({ message: "User deactivated successfully" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }
}
