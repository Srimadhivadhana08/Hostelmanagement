import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Debug route: POST /api/register
// Body: { name, email, password }
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, email, password, role, department, year } = body

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email, password required" }, { status: 400 })
        }
        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
        }

        // Step 1: Check if user already exists
        let existing = null
        try {
            existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
        } catch (findErr) {
            const msg = findErr instanceof Error ? findErr.message : String(findErr)
            return NextResponse.json({ error: `DB find error: ${msg}` }, { status: 500 })
        }

        if (existing) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
        }

        // Step 2: Hash password
        const hashed = await bcrypt.hash(password, 10)

        const validRole = ["STUDENT", "WARDEN", "ADMIN"].includes(role) ? role : "STUDENT"

        // Step 3: Create user
        try {
            const user = await prisma.user.create({
                data: {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password: hashed,
                    role: validRole,
                    isActive: true,
                    department: department ? String(department).trim() : null,
                    year: year ? parseInt(year) : null,
                },
                select: {
                    id: true, email: true, name: true, role: true, isActive: true, createdAt: true,
                },
            })
            return NextResponse.json({ user }, { status: 201 })
        } catch (createErr) {
            const msg = createErr instanceof Error ? createErr.message : String(createErr)
            return NextResponse.json({ error: `DB create error: ${msg}` }, { status: 500 })
        }

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ error: `Unexpected error: ${msg}` }, { status: 500 })
    }
}
