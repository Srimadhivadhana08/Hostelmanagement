import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await props.params
        const outpass = await prisma.outpass.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        department: true,
                        room: { select: { roomNumber: true, block: true } }
                    }
                }
            },
        })

        if (!outpass) return NextResponse.json({ error: "Outpass not found" }, { status: 404 })

        // Students can only view their own outpass
        if (session.user?.role === "STUDENT" && outpass.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        return NextResponse.json({ outpass })
    } catch (error) {
        console.error("[OUTPASS GET ID]", error)
        return NextResponse.json({ error: "Failed to fetch outpass" }, { status: 500 })
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
        const { status, remarks } = body

        if (!status) return NextResponse.json({ error: "Status is required" }, { status: 400 })

        // Fetch current outpass to validate transitions
        const current = await prisma.outpass.findUnique({ where: { id } })
        if (!current) return NextResponse.json({ error: "Outpass not found" }, { status: 404 })

        const role = session.user?.role

        // ADMIN (HOD) can only act on PENDING requests
        // and can only move to PENDING_WARDEN (approve) or REJECTED
        if (role === "ADMIN") {
            if (current.status !== "PENDING") {
                return NextResponse.json(
                    { error: "HOD can only review requests with status PENDING" },
                    { status: 400 }
                )
            }
            if (!["PENDING_WARDEN", "REJECTED"].includes(status)) {
                return NextResponse.json(
                    { error: "HOD can only approve (PENDING_WARDEN) or reject (REJECTED)" },
                    { status: 400 }
                )
            }

            const outpass = await prisma.outpass.update({
                where: { id },
                data: {
                    status,
                    hodRemarks: remarks || null,
                    hodApprovedBy: session.user.id as string,
                    hodApprovedAt: new Date(),
                },
            })
            return NextResponse.json({ outpass })
        }

        // WARDEN can only act on PENDING_WARDEN requests
        // and can only move to APPROVED or REJECTED
        if (role === "WARDEN") {
            if (current.status !== "PENDING_WARDEN") {
                return NextResponse.json(
                    { error: "Warden can only review requests with status PENDING_WARDEN" },
                    { status: 400 }
                )
            }
            if (!["APPROVED", "REJECTED"].includes(status)) {
                return NextResponse.json(
                    { error: "Warden can only approve (APPROVED) or reject (REJECTED)" },
                    { status: 400 }
                )
            }

            const outpass = await prisma.outpass.update({
                where: { id },
                data: {
                    status,
                    remarks: remarks || null,
                    approvedBy: session.user.id as string,
                    approvedAt: new Date(),
                },
            })
            return NextResponse.json({ outpass })
        }

        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    } catch (error) {
        console.error("[OUTPASS PATCH ID]", error)
        return NextResponse.json({ error: "Failed to update outpass" }, { status: 500 })
    }
}
