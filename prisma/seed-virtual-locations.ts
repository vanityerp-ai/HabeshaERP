import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding virtual locations...')

  // Create or update "online" location with specific ID
  const onlineLocation = await prisma.location.upsert({
    where: { id: 'online' },
    update: {
      name: 'Online Store',
      address: 'Online',
      city: 'Doha',
      country: 'Qatar',
      isActive: true,
    },
    create: {
      id: 'online',
      name: 'Online Store',
      address: 'Online',
      city: 'Doha',
      country: 'Qatar',
      isActive: true,
    },
  })

  console.log('✅ Online location created/updated:', onlineLocation.id)

  // Create or update "home" location with specific ID
  const homeLocation = await prisma.location.upsert({
    where: { id: 'home' },
    update: {
      name: 'Home Service',
      address: 'Mobile Service',
      city: 'Doha',
      country: 'Qatar',
      isActive: true,
    },
    create: {
      id: 'home',
      name: 'Home Service',
      address: 'Mobile Service',
      city: 'Doha',
      country: 'Qatar',
      isActive: true,
    },
  })

  console.log('✅ Home location created/updated:', homeLocation.id)

  // Verify the locations exist
  const allLocations = await prisma.location.findMany({
    orderBy: { name: 'asc' }
  })

  console.log('\n📍 All locations in database:')
  allLocations.forEach(loc => {
    console.log(`  - ${loc.name} (ID: ${loc.id})`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error seeding virtual locations:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

