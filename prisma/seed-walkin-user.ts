import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding walk-in customer user...')

  // Create or update walk-in customer user
  const walkInUser = await prisma.user.upsert({
    where: { email: 'walkin@vanitypos.local' },
    update: {},
    create: {
      id: 'walkin-customer',
      email: 'walkin@vanitypos.local',
      password: 'no-password-needed', // This user won't log in
      role: 'CLIENT',
      clientProfile: {
        create: {
          name: 'Walk-in Customer',
          phone: '0000000000',
        },
      },
    },
  })

  console.log('✅ Walk-in customer user created:', walkInUser.id)
  console.log('   Email:', walkInUser.email)
  console.log('   Role:', walkInUser.role)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding walk-in customer:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

