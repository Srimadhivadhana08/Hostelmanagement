/**
 * The user has requested to completely remove all mock and demo data.
 * The seed script is intentionally disabled.
 * Instead, use the real-time signup system to register authentic accounts dynamically.
 * Data is securely and permanently persisted to MongoDB naturally via the application runtime APIs.
 */
async function main() {
  console.log('✅ Seeding is disabled based on the requirement of full dynamic realtime data without mock users.')
}

main().catch(console.error)