import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const date = searchParams.get("date")
        const from = searchParams.get("from")
        const to = searchParams.get("to")

        const where: Record<string, unknown> = {}
        if (date) {
            const d = new Date(date); d.setHours(0, 0, 0, 0)
            const d2 = new Date(d); d2.setHours(23, 59, 59, 999)
            where.date = { gte: d, lte: d2 }
        } else if (from || to) {
            where.date = {}
            if (from) (where.date as Record<string, unknown>).gte = new Date(from)
            if (to) (where.date as Record<string, unknown>).lte = new Date(to)
        } else {
            // Default: this week
            const start = new Date(); start.setDate(start.getDate() - 3); start.setHours(0, 0, 0, 0)
            const end = new Date(); end.setDate(end.getDate() + 3); end.setHours(23, 59, 59, 999)
            where.date = { gte: start, lte: end }
        }

        const menus = await prisma.mess.findMany({ where, orderBy: { date: "asc" } })
        return NextResponse.json({ menus })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch mess menu" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMIN", "WARDEN"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const body = await req.json()
        const { date, breakfast, lunch, dinner, special } = body
        if (!date || !breakfast || !lunch || !dinner) {
            return NextResponse.json({ error: "date, breakfast, lunch and dinner are required" }, { status: 400 })
        }
        const menuDate = new Date(date); menuDate.setHours(0, 0, 0, 0)
        const menu = await prisma.mess.upsert({
            where: { date: menuDate },
            update: { breakfast, lunch, dinner, special },
            create: { date: menuDate, breakfast, lunch, dinner, special },
        })
        return NextResponse.json({ menu }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Failed to create/update mess menu" }, { status: 500 })
    }
}
