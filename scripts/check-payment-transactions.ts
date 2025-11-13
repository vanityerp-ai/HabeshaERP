import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking payment transactions...\n')

  // Get all appointments with payment status
  const appointments = await prisma.appointment.findMany({
    where: {
      paymentStatus: 'paid'
    },
    include: {
      client: {
        include: {
          clientProfile: true
        }
      },
      services: {
        include: {
          service: true
        }
      },
      products: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      date: 'desc'
    }
  })

  console.log(`📋 Found ${appointments.length} paid appointments:\n`)

  for (const apt of appointments) {
    console.log(`\n📅 Appointment: ${apt.id}`)
    console.log(`   Client: ${apt.client?.clientProfile?.name || 'Unknown'}`)
    console.log(`   Date: ${apt.date}`)
    console.log(`   Total Price: QAR ${apt.totalPrice}`)
    console.log(`   Payment Status: ${apt.paymentStatus}`)
    console.log(`   Payment Method: ${apt.paymentMethod || 'N/A'}`)
    console.log(`   Payment Date: ${apt.paymentDate || 'N/A'}`)
    console.log(`   Final Amount: QAR ${apt.finalAmount || apt.totalPrice}`)
    
    // Check if transaction exists for this appointment
    const transactions = await prisma.transaction.findMany({
      where: {
        appointmentId: apt.id
      }
    })

    console.log(`   Transactions: ${transactions.length}`)
    
    if (transactions.length > 0) {
      transactions.forEach((tx, index) => {
        console.log(`     ${index + 1}. Transaction ID: ${tx.id}`)
        console.log(`        Amount: QAR ${tx.amount}`)
        console.log(`        Type: ${tx.type}`)
        console.log(`        Status: ${tx.status}`)
        console.log(`        Method: ${tx.method}`)
        console.log(`        Date: ${tx.createdAt}`)
      })
    } else {
      console.log(`     ⚠️ NO TRANSACTIONS FOUND FOR THIS PAID APPOINTMENT!`)
    }
  }

  // Also check all transactions
  console.log('\n\n📊 All Transactions in Database:')
  const allTransactions = await prisma.transaction.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  })

  console.log(`\nTotal transactions: ${allTransactions.length}`)
  allTransactions.forEach((tx, index) => {
    console.log(`\n${index + 1}. Transaction: ${tx.id}`)
    console.log(`   Amount: QAR ${tx.amount}`)
    console.log(`   Type: ${tx.type}`)
    console.log(`   Status: ${tx.status}`)
    console.log(`   Method: ${tx.method}`)
    console.log(`   Date: ${tx.createdAt}`)
    console.log(`   Appointment ID: ${tx.appointmentId || 'N/A'}`)
    console.log(`   User ID: ${tx.userId}`)
  })
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

