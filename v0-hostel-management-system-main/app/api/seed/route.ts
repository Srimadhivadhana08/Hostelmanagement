import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// One-time seed endpoint - REMOVE or secure in production!
// Access via: GET http://localhost:3000/api/seed?secret=hostel-seed-2026
export async function GET(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get("secret")
    if (secret !== "hostel-seed-2026") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const adminPass = await bcrypt.hash("Admin@123", 12)
        const wardenPass = await bcrypt.hash("Warden@123", 12)
        const studentPass = await bcrypt.hash("Student@123", 12)
        const results: string[] = []

        // Helper: find-or-create WITHOUT upsert (M0 doesn't support transactions)
        async function findOrCreateUser(email: string, data: Record<string, unknown>) {
            const existing = await prisma.user.findUnique({ where: { email } })
            if (existing) {
                // Just update the password in case it changed
                await prisma.user.update({ where: { id: existing.id }, data: { password: data.password as string, isActive: true } })
                return existing
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return prisma.user.create({ data: data as any })
        }

        // Users
        const admin = await findOrCreateUser("admin@hostel.com", { email: "admin@hostel.com", password: adminPass, name: "Admin User", role: "ADMIN", phone: "9000000001", address: "Admin Office", isActive: true })
        results.push("✅ admin@hostel.com / Admin@123")

        await findOrCreateUser("warden1@hostel.com", { email: "warden1@hostel.com", password: wardenPass, name: "Ramesh Kumar", role: "WARDEN", phone: "9000000002", address: "Warden Quarters A", isActive: true })
        results.push("✅ warden1@hostel.com / Warden@123")

        await findOrCreateUser("warden2@hostel.com", { email: "warden2@hostel.com", password: wardenPass, name: "Priya Sharma", role: "WARDEN", phone: "9000000003", address: "Warden Quarters B", isActive: true })
        results.push("✅ warden2@hostel.com / Warden@123")

        // Rooms - find or create
        const roomDefs = [
            { roomNumber: "A101", type: "SINGLE", capacity: 1, price: 8000, floor: "1", block: "A", amenities: ["WiFi", "AC"] },
            { roomNumber: "A201", type: "DOUBLE", capacity: 2, price: 6000, floor: "2", block: "A", amenities: ["WiFi", "Fan"] },
            { roomNumber: "A301", type: "TRIPLE", capacity: 3, price: 5000, floor: "3", block: "A", amenities: ["WiFi", "Fan"] },
            { roomNumber: "B101", type: "DOUBLE", capacity: 2, price: 6500, floor: "1", block: "B", amenities: ["WiFi", "AC"] },
            { roomNumber: "B201", type: "TRIPLE", capacity: 3, price: 5500, floor: "2", block: "B", amenities: ["WiFi", "Fan"] },
        ]
        const rooms: Array<{ id: string }> = []
        for (const r of roomDefs) {
            const ex = await prisma.room.findUnique({ where: { roomNumber: r.roomNumber } })
            if (ex) { rooms.push({ id: ex.id }) }
            else {
                const nr = await prisma.room.create({ data: { ...r, type: r.type as "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY", occupied: 0, status: "AVAILABLE" } })
                rooms.push({ id: nr.id })
            }
        }
        results.push(`✅ ${rooms.length} rooms ready`)

        // Students
        const studDefs = [
            { email: "student1@hostel.com", name: "Rahul Mehta", phone: "9100000001", roomId: rooms[1]?.id },
            { email: "student2@hostel.com", name: "Arjun Kapoor", phone: "9100000002", roomId: rooms[1]?.id },
            { email: "student3@hostel.com", name: "Sneha Reddy", phone: "9100000003", roomId: rooms[2]?.id },
            { email: "student4@hostel.com", name: "Vikram Singh", phone: "9100000004", roomId: rooms[2]?.id },
            { email: "student5@hostel.com", name: "Pooja Nair", phone: "9100000005", roomId: rooms[4]?.id },
        ]
        for (const s of studDefs) {
            await findOrCreateUser(s.email, { email: s.email, password: studentPass, name: s.name, role: "STUDENT", phone: s.phone, address: "Student Hostel", roomId: s.roomId, isActive: true })
        }
        results.push("✅ student1-5@hostel.com / Student@123")

        // Update room counts
        for (const [id, occ] of [[rooms[1]?.id, 2], [rooms[2]?.id, 2], [rooms[4]?.id, 1]] as Array<[string | undefined, number]>) {
            if (id) await prisma.room.update({ where: { id }, data: { occupied: occ, status: "OCCUPIED" } }).catch(() => { })
        }

        // Notice
        const existingNotice = await prisma.notice.findFirst({ where: { title: "Welcome to Hostel Hub!" } })
        if (!existingNotice) {
            await prisma.notice.create({ data: { title: "Welcome to Hostel Hub!", content: "Welcome! Log in to explore mess menu, complaints, notices, and leave applications.", category: "GENERAL", priority: "HIGH", postedBy: admin.id, isActive: true } })
        }
        results.push("✅ Welcome notice")

        // Mess menu
        const today = new Date()
        const menuItems = [
            { breakfast: "Idli, Sambar, Chutney, Tea", lunch: "Rice, Dal, Sabzi, Roti, Curd", dinner: "Roti, Paneer Curry, Dal, Rice" },
            { breakfast: "Dosa, Chutney, Coffee", lunch: "Rice, Rasam, Curd, Papad", dinner: "Chapati, Mixed Veg, Dal Tadka" },
            { breakfast: "Poha, Milk, Fruits", lunch: "Pulao, Raita, Aloo Gobi", dinner: "Rice, Dal Makhani, Salad" },
            { breakfast: "Upma, Tea, Boiled Egg", lunch: "Rice, Chana Dal, Bhindi, Roti", dinner: "Roti, Paneer, Dal, Kheer" },
            { breakfast: "Paratha, Curd, Chai", lunch: "Rice, Lemon Dal, Potato Fry", dinner: "Chapati, Palak Dal, Mixed Veg" },
            { breakfast: "Bread, Peanut Butter, Milk", lunch: "Fried Rice, Manchurian", dinner: "Rice, Dal Fry, Aloo Matar" },
            { breakfast: "Puri, Halwa, Aloo Bhaji", lunch: "Biryani, Raita, Salan", dinner: "Rice, Dal, Roti, Curry", special: "Saturday Biryani! 🍛" },
        ]
        for (let d = -3; d <= 3; d++) {
            const date = new Date(today)
            date.setDate(date.getDate() + d)
            date.setHours(0, 0, 0, 0)
            const ex = await prisma.mess.findUnique({ where: { date } })
            if (!ex) await prisma.mess.create({ data: { date, ...menuItems[(d + 3) % menuItems.length] } }).catch(() => { })
        }
        results.push("✅ Mess menu for the week")

        // Fees for students
        const allStudents = await prisma.user.findMany({ where: { role: "STUDENT" } })
        for (const [i, s] of allStudents.entries()) {
            const ex = await prisma.fee.findFirst({ where: { userId: s.id, month: "March", year: 2026 } })
            if (!ex) {
                await prisma.fee.create({ data: { userId: s.id, month: "March", year: 2026, roomRent: 6000, messCharges: 3500, otherCharges: 500, totalAmount: 10000, paid: i < 2 ? 10000 : i < 4 ? 5000 : 0, due: i < 2 ? 0 : i < 4 ? 5000 : 10000, status: i < 2 ? "PAID" : i < 4 ? "PARTIAL" : "PENDING" } }).catch(() => { })
            }
        }
        results.push("✅ March fees for all students")

        // Sample complaints & outpass
        const s1 = await prisma.user.findUnique({ where: { email: "student1@hostel.com" } })
        if (s1) {
            const exC = await prisma.complaint.findFirst({ where: { userId: s1.id } })
            if (!exC) await prisma.complaint.create({ data: { userId: s1.id, title: "WiFi not working in Block A", description: "WiFi has been intermittent for 2 days.", category: "ELECTRICAL", status: "OPEN", priority: "HIGH" } }).catch(() => { })
            const exO = await prisma.outpass.findFirst({ where: { userId: s1.id } })
            if (!exO) await prisma.outpass.create({ data: { userId: s1.id, reason: "Family function", destination: "Chennai", fromDate: new Date(Date.now() + 3 * 86400000), toDate: new Date(Date.now() + 5 * 86400000), status: "PENDING" } }).catch(() => { })
            results.push("✅ Sample complaint + outpass")
        }

        return NextResponse.json({
            success: true,
            message: "Database seeded! ✅",
            credentials: { admin: "admin@hostel.com / Admin@123", warden: "warden1@hostel.com / Warden@123", student: "student1@hostel.com / Student@123" },
            details: results,
        })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        return NextResponse.json({ error: "Seed failed", details: msg }, { status: 500 })
    }
}
