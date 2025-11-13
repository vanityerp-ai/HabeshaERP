import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Creating missing transactions for paid appointments...\n')

  // Get all paid appointments without transactions
  const paidAppointments = await prisma.appointment.findMany({
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
    }
  })

  console.log(`Found ${paidAppointments.length} paid appointments\n`)

  for (const apt of paidAppointments) {
    // Check if transaction already exists
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        appointmentId: apt.id
      }
    })

    if (existingTransactions.length > 0) {
      console.log(`✅ Appointment ${apt.id} already has ${existingTransactions.length} transaction(s)`)
      continue
    }

    console.log(`\n📝 Creating transaction for appointment ${apt.id}`)
    console.log(`   Client: ${apt.client?.clientProfile?.name || 'Unknown'}`)
    console.log(`   Amount: QAR ${apt.finalAmount || apt.totalPrice}`)
    console.log(`   Payment Method: ${apt.paymentMethod || 'CASH'}`)

    // Calculate service and product amounts
    let serviceAmount = 0
    let productAmount = 0

    // Sum up service prices
    for (const svc of apt.services) {
      serviceAmount += svc.price || 0
    }

    // Sum up product prices
    for (const prod of apt.products) {
      productAmount += (prod.price || 0) * (prod.quantity || 1)
    }

    const totalAmount = apt.finalAmount || apt.totalPrice || (serviceAmount + productAmount)

    // Create transaction items
    const items = [
      ...apt.services.map(svc => ({
        type: 'service' as const,
        id: svc.serviceId,
        name: svc.service?.name || 'Service',
        price: svc.price || 0,
        quantity: 1
      })),
      ...apt.products.map(prod => ({
        type: 'product' as const,
        id: prod.productId,
        name: prod.product?.name || 'Product',
        price: prod.price || 0,
        quantity: prod.quantity || 1
      }))
    ]

    try {
      const transaction = await prisma.transaction.create({
        data: {
          userId: apt.clientId,
          amount: totalAmount,
          type: 'service_sale', // Use lowercase to match enum
          status: 'completed', // Use lowercase to match enum
          method: apt.paymentMethod ? apt.paymentMethod.toLowerCase() : 'cash', // Use lowercase to match enum
          source: 'calendar', // Use lowercase to match enum
          reference: apt.id,
          description: `Payment for appointment with ${apt.client?.clientProfile?.name || 'client'}`,
          locationId: apt.location,
          appointmentId: apt.id,
          serviceAmount: serviceAmount,
          productAmount: productAmount,
          originalServiceAmount: apt.originalAmount || serviceAmount,
          discountPercentage: apt.discountPercentage,
          discountAmount: apt.discountAmount,
          items: JSON.stringify(items),
          createdAt: apt.paymentDate ? new Date(apt.paymentDate) : new Date(),
          updatedAt: apt.paymentDate ? new Date(apt.paymentDate) : new Date(),
        }
      })

      console.log(`   ✅ Transaction created: ${transaction.id}`)
      console.log(`      Amount: QAR ${transaction.amount}`)
      console.log(`      Service Amount: QAR ${transaction.serviceAmount || 0}`)
      console.log(`      Product Amount: QAR ${transaction.productAmount || 0}`)
      console.log(`      Items: ${items.length}`)
    } catch (error) {
      console.error(`   ❌ Failed to create transaction:`, error)
    }
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

