import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        const { id } = await props.params
        const notice = await prisma.notice.findUnique({ where: { id } })
        if (!notice) return NextResponse.json({ error: "Notice not found" }, { status: 404 })
        return NextResponse.json({ notice })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch notice" }, { status: 500 })
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
        const { title, content, category, priority, expiresAt, isActive } = body
        const notice = await prisma.notice.update({
            where: { id },
            data: { title, content, category, priority, isActive, expiresAt: expiresAt ? new Date(expiresAt) : undefined },
        })
        return NextResponse.json({ notice })
    } catch (error) {
        return NextResponse.json({ error: "Failed to update notice" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMIN", "WARDEN"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const { id } = await props.params
        await prisma.notice.delete({ where: { id } })
        return NextResponse.json({ message: "Notice deleted" })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete notice" }, { status: 500 })
    }
}
