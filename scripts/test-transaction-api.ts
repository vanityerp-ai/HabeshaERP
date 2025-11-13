import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing transaction API data types...\n')

  // Get transactions directly from database
  const dbTransactions = await prisma.transaction.findMany({
    take: 2,
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log('📊 Database Transactions (Raw Prisma):')
  dbTransactions.forEach((tx, index) => {
    console.log(`\n${index + 1}. Transaction ${tx.id}:`)
    console.log(`   amount type: ${typeof tx.amount}`)
    console.log(`   amount value: ${tx.amount}`)
    console.log(`   amount constructor: ${tx.amount.constructor.name}`)
    console.log(`   serviceAmount type: ${typeof tx.serviceAmount}`)
    console.log(`   serviceAmount value: ${tx.serviceAmount}`)
    console.log(`   serviceAmount constructor: ${tx.serviceAmount?.constructor.name}`)
    
    // Test conversion
    const amountAsNumber = Number(tx.amount)
    const serviceAmountAsNumber = tx.serviceAmount ? Number(tx.serviceAmount) : 0
    console.log(`   amount as Number: ${amountAsNumber} (type: ${typeof amountAsNumber})`)
    console.log(`   serviceAmount as Number: ${serviceAmountAsNumber} (type: ${typeof serviceAmountAsNumber})`)
  })

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

