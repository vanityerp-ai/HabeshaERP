import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAppointmentServices() {
  try {
    console.log('🔍 Checking appointment services in database...\n')

    // Get all appointments with their services
    const appointments = await prisma.appointment.findMany({
      include: {
        services: {
          include: {
            service: true
          }
        },
        products: {
          include: {
            product: true
          }
        },
        client: {
          select: {
            clientProfile: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    console.log(`Found ${appointments.length} appointments\n`)

    appointments.forEach((apt, index) => {
      console.log(`\n📋 Appointment ${index + 1}:`)
      console.log(`  ID: ${apt.id}`)
      console.log(`  Client: ${apt.client?.clientProfile?.name || 'Unknown'}`)
      console.log(`  Date: ${apt.date}`)
      console.log(`  Total Price: ${apt.totalPrice}`)
      console.log(`  Services (${apt.services.length}):`)
      
      if (apt.services.length === 0) {
        console.log(`    ⚠️ NO SERVICES FOUND!`)
      } else {
        apt.services.forEach((svc, svcIndex) => {
          console.log(`    ${svcIndex + 1}. ${svc.service?.name || 'Unknown'} - QAR ${svc.price}`)
          console.log(`       Service ID: ${svc.serviceId}`)
          console.log(`       AppointmentService ID: ${svc.id}`)
        })
      }

      console.log(`  Products (${apt.products.length}):`)
      if (apt.products.length === 0) {
        console.log(`    (No products)`)
      } else {
        apt.products.forEach((prod, prodIndex) => {
          console.log(`    ${prodIndex + 1}. ${prod.product?.name || 'Unknown'} - QAR ${prod.price} x ${prod.quantity}`)
        })
      }
    })

    console.log('\n✅ Check complete!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAppointmentServices()

