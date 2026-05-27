import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        const { id } = await props.params
        const complaint = await prisma.complaint.findUnique({
            where: { id },
            include: { user: { select: { id: true, name: true, email: true, room: { select: { roomNumber: true, block: true } } } } },
        })
        if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
        return NextResponse.json({ complaint })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch complaint" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        const { id } = await props.params
        const body = await req.json()
        const { status, assignedTo, resolution, priority } = body
        const updateData: Record<string, unknown> = {}
        if (status !== undefined) updateData.status = status
        if (assignedTo !== undefined) updateData.assignedTo = assignedTo
        if (resolution !== undefined) updateData.resolution = resolution
        if (priority !== undefined) updateData.priority = priority
        if (status === "RESOLVED" || status === "CLOSED") updateData.resolvedAt = new Date()
        const complaint = await prisma.complaint.update({ where: { id }, data: updateData })
        return NextResponse.json({ complaint })
    } catch (error) {
        return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user?.role === "STUDENT") {
            // Students can only delete their own OPEN complaints
            const { id } = await props.params
            const complaint = await prisma.complaint.findUnique({ where: { id } })
            if (!complaint || complaint.userId !== session?.user?.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
            if (complaint.status !== "OPEN") return NextResponse.json({ error: "Cannot delete resolved complaint" }, { status: 400 })
        }
        const { id } = await props.params
        await prisma.complaint.delete({ where: { id } })
        return NextResponse.json({ message: "Complaint deleted" })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete complaint" }, { status: 500 })
    }
}
