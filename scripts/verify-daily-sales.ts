import { PrismaClient } from '@prisma/client'
import { format, isSameDay } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying daily sales data...\n')

  const today = new Date()
  
  // Get all transactions for today
  const allTransactions = await prisma.transaction.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log(`📊 Total transactions in database: ${allTransactions.length}\n`)

  // Filter for today's transactions
  const todaysTransactions = allTransactions.filter(tx => 
    isSameDay(new Date(tx.createdAt), today)
  )

  console.log(`📅 Today's transactions (${format(today, 'MMM dd, yyyy')}): ${todaysTransactions.length}\n`)

  if (todaysTransactions.length === 0) {
    console.log('⚠️ No transactions found for today!')
    console.log('\nShowing all transactions instead:\n')
    
    allTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. Transaction: ${tx.id}`)
      console.log(`   Date: ${format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}`)
      console.log(`   Amount: QAR ${tx.amount}`)
      console.log(`   Type: ${tx.type}`)
      console.log(`   Status: ${tx.status}`)
      console.log(`   Source: ${tx.source || 'N/A'}`)
      console.log(`   Service Amount: QAR ${tx.serviceAmount || 0}`)
      console.log(`   Product Amount: QAR ${tx.productAmount || 0}`)
      console.log(`   Appointment ID: ${tx.appointmentId || 'N/A'}`)
      console.log('')
    })
  } else {
    let totalRevenue = 0
    let serviceRevenue = 0
    let productRevenue = 0

    todaysTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. Transaction: ${tx.id}`)
      console.log(`   Time: ${format(new Date(tx.createdAt), 'HH:mm')}`)
      console.log(`   Amount: QAR ${tx.amount}`)
      console.log(`   Type: ${tx.type}`)
      console.log(`   Status: ${tx.status}`)
      console.log(`   Source: ${tx.source || 'N/A'}`)
      console.log(`   Service Amount: QAR ${tx.serviceAmount || 0}`)
      console.log(`   Product Amount: QAR ${tx.productAmount || 0}`)
      console.log(`   Appointment ID: ${tx.appointmentId || 'N/A'}`)
      console.log('')

      if (tx.status === 'completed') {
        totalRevenue += Number(tx.amount)
        serviceRevenue += Number(tx.serviceAmount || 0)
        productRevenue += Number(tx.productAmount || 0)
      }
    })

    console.log('📈 Daily Sales Summary:')
    console.log(`   Total Revenue: QAR ${totalRevenue}`)
    console.log(`   Service Revenue: QAR ${serviceRevenue}`)
    console.log(`   Product Revenue: QAR ${productRevenue}`)
    console.log(`   Completed Transactions: ${todaysTransactions.filter(tx => tx.status === 'completed').length}`)
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

