import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Normalizing transaction values to match TypeScript enums...\n')

  // Get all transactions
  const transactions = await prisma.transaction.findMany()

  console.log(`Found ${transactions.length} transactions to normalize\n`)

  for (const tx of transactions) {
    const updates: any = {}

    // Normalize status (COMPLETED -> completed, PENDING -> pending, etc.)
    if (tx.status) {
      const normalizedStatus = tx.status.toLowerCase()
      if (normalizedStatus !== tx.status) {
        updates.status = normalizedStatus
        console.log(`Transaction ${tx.id}: status ${tx.status} -> ${normalizedStatus}`)
      }
    }

    // Normalize type (SERVICE_SALE -> service_sale, PRODUCT_SALE -> product_sale, etc.)
    if (tx.type) {
      const normalizedType = tx.type.toLowerCase()
      if (normalizedType !== tx.type) {
        updates.type = normalizedType
        console.log(`Transaction ${tx.id}: type ${tx.type} -> ${normalizedType}`)
      }
    }

    // Normalize method (CASH -> cash, CREDIT_CARD -> credit_card, etc.)
    if (tx.method) {
      const normalizedMethod = tx.method.toLowerCase()
      if (normalizedMethod !== tx.method) {
        updates.method = normalizedMethod
        console.log(`Transaction ${tx.id}: method ${tx.method} -> ${normalizedMethod}`)
      }
    }

    // Normalize source (CALENDAR -> calendar, POS -> pos, etc.)
    if (tx.source) {
      const normalizedSource = tx.source.toLowerCase()
      if (normalizedSource !== tx.source) {
        updates.source = normalizedSource
        console.log(`Transaction ${tx.id}: source ${tx.source} -> ${normalizedSource}`)
      }
    }

    // Update if there are changes
    if (Object.keys(updates).length > 0) {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: updates
      })
      console.log(`✅ Updated transaction ${tx.id}\n`)
    }
  }

  console.log('\n✅ Done! All transactions normalized.')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

