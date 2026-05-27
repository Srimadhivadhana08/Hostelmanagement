import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMIN", "WARDEN"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const { id } = await props.params
        const body = await req.json()
        const { paid, status, transactionId } = body

        const fee = await prisma.fee.findUnique({ where: { id } })
        if (!fee) return NextResponse.json({ error: "Fee record not found" }, { status: 404 })

        const newPaid = paid !== undefined ? paid : fee.paid
        const newDue = fee.totalAmount - newPaid
        const newStatus = status || (newPaid >= fee.totalAmount ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING")

        const updated = await prisma.fee.update({
            where: { id },
            data: {
                paid: newPaid,
                due: newDue,
                status: newStatus,
                transactionId: transactionId,
                paidAt: newStatus === "PAID" ? (fee.paidAt || new Date()) : fee.paidAt,
            },
        })
        return NextResponse.json({ fee: updated })
    } catch (error) {
        return NextResponse.json({ error: "Failed to update fee" }, { status: 500 })
    }
}

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        const { id } = await props.params
        const fee = await prisma.fee.findUnique({ where: { id }, include: { user: { select: { name: true, email: true, room: { select: { roomNumber: true } } } } } })
        if (!fee) return NextResponse.json({ error: "Fee not found" }, { status: 404 })
        return NextResponse.json({ fee })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch fee" }, { status: 500 })
    }
}
