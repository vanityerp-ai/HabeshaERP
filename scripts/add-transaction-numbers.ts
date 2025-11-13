import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addTransactionNumbers() {
  console.log('🔢 Adding sequential transaction numbers to existing transactions...')

  try {
    // Get all transactions ordered by creation date
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        transactionNumber: true,
        createdAt: true
      }
    })

    console.log(`📊 Found ${transactions.length} transactions`)

    let nextNumber = 10000 // Start from 10000 for 5-digit numbers
    let updated = 0

    for (const tx of transactions) {
      if (!tx.transactionNumber) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { transactionNumber: nextNumber }
        })
        console.log(`✅ Updated transaction ${tx.id} with number ${nextNumber}`)
        nextNumber++
        updated++
      }
    }

    console.log(`\n✅ Successfully added transaction numbers to ${updated} transactions`)
    console.log(`📈 Next transaction number will be: ${nextNumber}`)

  } catch (error) {
    console.error('❌ Error adding transaction numbers:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addTransactionNumbers()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

