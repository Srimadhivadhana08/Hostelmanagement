import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("Testing DB connection...")
    
    try {
        // Test basic connection
        const userCount = await prisma.user.count()
        console.log("✅ DB connected! User count:", userCount)
        
        // Try to find admin
        const existing = await prisma.user.findUnique({ where: { email: "admin@hostel.com" } })
        console.log("Existing admin:", existing ? `Found (${existing.role})` : "Not found")
        
        if (existing) {
            console.log("\n✅ Admin already exists! Login with:")
            console.log("  Email:    admin@hostel.com")
            console.log("  Password: Admin@123")
            return
        }
        
        // Create admin
        const pw = await bcrypt.hash("Admin@123", 10)
        const user = await prisma.user.create({
            data: {
                email: "admin@hostel.com",
                password: pw,
                name: "Admin User",
                role: "ADMIN",
                phone: "9000000001",
                address: "Admin Office",
                isActive: true,
            }
        })
        console.log("✅ Admin created:", user.id)
        
    } catch (err: unknown) {
        const error = err as { message?: string; code?: string; meta?: unknown }
        console.error("❌ Error:", error.message)
        if (error.code) console.error("   Code:", error.code)
        if (error.meta) console.error("   Meta:", JSON.stringify(error.meta, null, 2))
    }
}

main().finally(() => prisma.$disconnect())
