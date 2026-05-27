/**
 * Simple seed script - creates demo users only.
 * Run: npx tsx prisma/seed-simple.ts
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Creating demo users...")

    const adminPass = await bcrypt.hash("Admin@123", 12)
    const wardenPass = await bcrypt.hash("Warden@123", 12)
    const studentPass = await bcrypt.hash("Student@123", 12)

    // Upsert admin
    const admin = await prisma.user.upsert({
        where: { email: "admin@hostel.com" },
        update: { password: adminPass, isActive: true },
        create: {
            email: "admin@hostel.com",
            password: adminPass,
            name: "Admin User",
            role: "ADMIN",
            phone: "9000000001",
            address: "Hostel Admin Office",
            isActive: true,
        },
    })
    console.log("✅ Admin:", admin.email)

    // Upsert warden 1
    const w1 = await prisma.user.upsert({
        where: { email: "warden1@hostel.com" },
        update: { password: wardenPass, isActive: true },
        create: {
            email: "warden1@hostel.com",
            password: wardenPass,
            name: "Ramesh Kumar",
            role: "WARDEN",
            phone: "9000000002",
            address: "Warden Quarters, Block A",
            isActive: true,
        },
    })
    console.log("✅ Warden:", w1.email)

    // Upsert warden 2
    const w2 = await prisma.user.upsert({
        where: { email: "warden2@hostel.com" },
        update: { password: wardenPass, isActive: true },
        create: {
            email: "warden2@hostel.com",
            password: wardenPass,
            name: "Priya Sharma",
            role: "WARDEN",
            phone: "9000000003",
            address: "Warden Quarters, Block B",
            isActive: true,
        },
    })
    console.log("✅ Warden:", w2.email)

    // Create rooms first (needed for students)
    const rooms: Array<{ id: string; roomNumber: string }> = []
    const roomsData = [
        { roomNumber: "A101", type: "SINGLE", capacity: 1, price: 8000, floor: "1", block: "A", amenities: ["WiFi", "AC"] },
        { roomNumber: "A102", type: "SINGLE", capacity: 1, price: 8000, floor: "1", block: "A", amenities: ["WiFi", "Fan"] },
        { roomNumber: "A201", type: "DOUBLE", capacity: 2, price: 6000, floor: "2", block: "A", amenities: ["WiFi", "Fan"] },
        { roomNumber: "A202", type: "DOUBLE", capacity: 2, price: 6500, floor: "2", block: "A", amenities: ["WiFi", "AC"] },
        { roomNumber: "B101", type: "TRIPLE", capacity: 3, price: 5000, floor: "1", block: "B", amenities: ["WiFi", "Fan"] },
        { roomNumber: "B102", type: "TRIPLE", capacity: 3, price: 5500, floor: "1", block: "B", amenities: ["WiFi", "AC"] },
    ]
    for (const r of roomsData) {
        try {
            const room = await prisma.room.upsert({
                where: { roomNumber: r.roomNumber },
                update: {},
                create: { ...r, type: r.type as "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY", occupied: 0, status: "AVAILABLE" },
            })
            rooms.push({ id: room.id, roomNumber: room.roomNumber })
        } catch (e) {
            console.warn("Room already exists or error:", r.roomNumber)
        }
    }
    console.log(`✅ ${rooms.length} rooms ready`)

    // Upsert students
    const studentsData = [
        { email: "student1@hostel.com", name: "Rahul Mehta", phone: "9100000001" },
        { email: "student2@hostel.com", name: "Arjun Kapoor", phone: "9100000002" },
        { email: "student3@hostel.com", name: "Sneha Reddy", phone: "9100000003" },
        { email: "student4@hostel.com", name: "Vikram Singh", phone: "9100000004" },
        { email: "student5@hostel.com", name: "Pooja Nair", phone: "9100000005" },
    ]

    for (const s of studentsData) {
        const roomId = rooms[0]?.id // Assign to first available room
        const student = await prisma.user.upsert({
            where: { email: s.email },
            update: { password: studentPass, isActive: true },
            create: {
                email: s.email,
                password: studentPass,
                name: s.name,
                role: "STUDENT",
                phone: s.phone,
                address: "Student Hostel",
                roomId: roomId,
                isActive: true,
            },
        })
        console.log("✅ Student:", student.email)
    }

    // Create a notice
    try {
        await prisma.notice.create({
            data: {
                title: "Welcome to Hostel Hub!",
                content: "Welcome to the College Hostel Hub management system. Please update your profile and check the mess menu.",
                category: "GENERAL",
                priority: "MEDIUM",
                postedBy: admin.id,
                isActive: true,
            },
        })
        console.log("✅ Created welcome notice")
    } catch { }

    console.log("\n🎉 Done! Login credentials:")
    console.log("  Admin:    admin@hostel.com   / Admin@123")
    console.log("  Warden:   warden1@hostel.com / Warden@123")
    console.log("  Student:  student1@hostel.com / Student@123")
}

main()
    .catch(e => { console.error("❌ Error:", e.message || e); process.exit(1) })
    .finally(() => prisma.$disconnect())
