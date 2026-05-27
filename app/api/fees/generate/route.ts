import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
        }

        const body = await req.json()
        const { month, year, roomRent = 6000, messCharges = 3500, otherCharges = 500 } = body

        if (!month || !year) return NextResponse.json({ error: "Month and year are required" }, { status: 400 })

        const students = await prisma.user.findMany({
            where: { role: "STUDENT", isActive: true },
            select: { id: true },
        })

        const total = roomRent + messCharges + otherCharges
        let created = 0
        let skipped = 0

        for (const student of students) {
            try {
                await prisma.fee.create({
                    data: {
                        userId: student.id,
                        month,
                        year: parseInt(year),
                        roomRent,
                        messCharges,
                        otherCharges,
                        totalAmount: total,
                        paid: 0,
                        due: total,
                    },
                })
                created++
            } catch {
                skipped++ // UniqueConstraint violation = already exists
            }
        }

        return NextResponse.json({ message: `Generated fees for ${created} students (${skipped} already existed)`, created, skipped })
    } catch (error) {
        return NextResponse.json({ error: "Failed to generate fees" }, { status: 500 })
    }
}
