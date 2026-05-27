/**
 * MongoDB Atlas M0-compatible seed script.
 * Uses findUnique + create (NO upsert, NO transactions).
 * Run: npx tsx prisma/seed-m0.ts
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
})

async function createUserIfNotExists(data: {
    email: string
    password: string
    name: string
    role: "ADMIN" | "WARDEN" | "STUDENT"
    phone?: string
    address?: string
    roomId?: string
}) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
        console.log(`  ⏩ Already exists: ${data.email}`)
        return existing
    }
    const user = await prisma.user.create({ data: { ...data, isActive: true } })
    console.log(`  ✅ Created: ${user.email} (${user.role})`)
    return user
}

async function createRoomIfNotExists(data: {
    roomNumber: string
    type: string
    capacity: number
    price: number
    floor: string
    block: string
    amenities: string[]
}) {
    try {
        const existing = await prisma.room.findUnique({ where: { roomNumber: data.roomNumber } })
        if (existing) {
            console.log(`  ⏩ Room exists: ${data.roomNumber}`)
            return existing
        }
        const room = await prisma.room.create({
            data: { ...data, type: data.type as "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY", occupied: 0, status: "AVAILABLE" },
        })
        console.log(`  ✅ Room created: ${data.roomNumber}`)
        return room
    } catch {
        const existing = await prisma.room.findUnique({ where: { roomNumber: data.roomNumber } })
        if (existing) return existing
        throw new Error(`Failed to create/find room ${data.roomNumber}`)
    }
}

async function main() {
    console.log("\n🌱 Seeding Hostel Hub database...\n")

    // Passwords
    const adminPass = await bcrypt.hash("Admin@123", 10)
    const wardenPass = await bcrypt.hash("Warden@123", 10)
    const studentPass = await bcrypt.hash("Student@123", 10)

    console.log("👤 Creating admin...")
    const admin = await createUserIfNotExists({
        email: "admin@hostel.com",
        password: adminPass,
        name: "Admin User",
        role: "ADMIN",
        phone: "9000000001",
        address: "Admin Office",
    })

    console.log("\n👤 Creating wardens...")
    await createUserIfNotExists({
        email: "warden1@hostel.com",
        password: wardenPass,
        name: "Ramesh Kumar",
        role: "WARDEN",
        phone: "9000000002",
        address: "Warden Quarters A",
    })
    await createUserIfNotExists({
        email: "warden2@hostel.com",
        password: wardenPass,
        name: "Priya Sharma",
        role: "WARDEN",
        phone: "9000000003",
        address: "Warden Quarters B",
    })

    console.log("\n🏠 Creating rooms...")
    const roomA101 = await createRoomIfNotExists({ roomNumber: "A101", type: "SINGLE", capacity: 1, price: 8000, floor: "1", block: "A", amenities: ["WiFi", "AC"] })
    const roomA201 = await createRoomIfNotExists({ roomNumber: "A201", type: "DOUBLE", capacity: 2, price: 6000, floor: "2", block: "A", amenities: ["WiFi", "Fan"] })
    await createRoomIfNotExists({ roomNumber: "A202", type: "DOUBLE", capacity: 2, price: 6500, floor: "2", block: "A", amenities: ["WiFi", "AC"] })
    await createRoomIfNotExists({ roomNumber: "B101", type: "TRIPLE", capacity: 3, price: 5000, floor: "1", block: "B", amenities: ["WiFi", "Fan"] })
    await createRoomIfNotExists({ roomNumber: "B102", type: "TRIPLE", capacity: 3, price: 5500, floor: "1", block: "B", amenities: ["WiFi", "AC"] })

    console.log("\n🎓 Creating students...")
    await createUserIfNotExists({ email: "student1@hostel.com", password: studentPass, name: "Rahul Mehta", role: "STUDENT", phone: "9100000001", roomId: roomA201.id })
    await createUserIfNotExists({ email: "student2@hostel.com", password: studentPass, name: "Arjun Kapoor", role: "STUDENT", phone: "9100000002", roomId: roomA201.id })
    await createUserIfNotExists({ email: "student3@hostel.com", password: studentPass, name: "Sneha Reddy", role: "STUDENT", phone: "9100000003", roomId: roomA101.id })
    await createUserIfNotExists({ email: "student4@hostel.com", password: studentPass, name: "Vikram Singh", role: "STUDENT", phone: "9100000004" })
    await createUserIfNotExists({ email: "student5@hostel.com", password: studentPass, name: "Pooja Nair", role: "STUDENT", phone: "9100000005" })

    // Create welcome notice (ignore if already exists)
    try {
        await prisma.notice.create({
            data: {
                title: "Welcome to Hostel Hub!",
                content: "Welcome to Hostel Hub. Please update your profile and check the mess menu for today's meals.",
                category: "GENERAL",
                priority: "MEDIUM",
                postedBy: admin.id,
                isActive: true,
            },
        })
        console.log("\n  ✅ Welcome notice created")
    } catch {
        console.log("\n  ⏩ Notice already exists")
    }

    // Update room occupancy counts
    console.log("\n🔄 Updating room occupancy counts...")
    const allRooms = await prisma.room.findMany({ select: { id: true } })
    for (const room of allRooms) {
        const count = await prisma.user.count({ where: { roomId: room.id, isActive: true } })
        const status = count === 0 ? "AVAILABLE" : "OCCUPIED"
        await prisma.room.update({ where: { id: room.id }, data: { occupied: count, status } })
    }
    console.log("  ✅ Occupancy updated")

    console.log("\n🎉 Seeding complete!\n")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("  LOGIN CREDENTIALS:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("  Admin:   admin@hostel.com    / Admin@123")
    console.log("  Warden:  warden1@hostel.com  / Warden@123")
    console.log("  Student: student1@hostel.com / Student@123")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
}

main()
    .catch(e => {
        console.error("\n❌ Seed failed:", e.message || e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
