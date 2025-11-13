import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing transaction source field...\n')

  // Get all transactions without a source
  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { source: null },
        { source: '' }
      ]
    }
  })

  console.log(`Found ${transactions.length} transactions without source\n`)

  for (const tx of transactions) {
    // Determine source based on appointmentId
    const source = tx.appointmentId ? 'CALENDAR' : 'MANUAL'

    console.log(`Updating transaction ${tx.id} to source: ${source}`)

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { source }
    })
  }

  console.log('\n✅ Done!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

