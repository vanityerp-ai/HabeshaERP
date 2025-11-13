import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function fixMissingAppointmentServices() {
  try {
    console.log('🔧 Fixing appointments with missing services...\n')

    // Get all appointments without services
    const appointments = await prisma.appointment.findMany({
      include: {
        services: true,
        client: {
          select: {
            clientProfile: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    console.log(`Found ${appointments.length} total appointments\n`)

    const appointmentsWithoutServices = appointments.filter(apt => apt.services.length === 0)
    console.log(`Found ${appointmentsWithoutServices.length} appointments without services\n`)

    if (appointmentsWithoutServices.length === 0) {
      console.log('✅ All appointments have services!')
      return
    }

    // Get all services to find matching ones by price
    const allServices = await prisma.service.findMany({
      orderBy: {
        price: 'asc'
      }
    })

    console.log(`\nAvailable services: ${allServices.length}`)
    console.log('\nServices by price:')
    allServices.forEach(svc => {
      console.log(`  - ${svc.name}: QAR ${svc.price}`)
    })

    console.log('\n' + '='.repeat(80))
    console.log('Appointments needing service assignment:')
    console.log('='.repeat(80) + '\n')

    for (const apt of appointmentsWithoutServices) {
      console.log(`\n📋 Appointment: ${apt.id}`)
      console.log(`   Client: ${apt.client?.clientProfile?.name || 'Unknown'}`)
      console.log(`   Date: ${apt.date}`)
      console.log(`   Total Price: QAR ${apt.totalPrice}`)
      
      // Try to find a service that matches the price
      const matchingService = allServices.find(svc => 
        parseFloat(svc.price.toString()) === parseFloat(apt.totalPrice.toString())
      )

      if (matchingService) {
        console.log(`   ✅ Found matching service: ${matchingService.name} (QAR ${matchingService.price})`)
        console.log(`   Creating AppointmentService record...`)
        
        try {
          await prisma.appointmentService.create({
            data: {
              appointmentId: apt.id,
              serviceId: matchingService.id,
              price: matchingService.price,
              duration: matchingService.duration || 60,
            }
          })
          console.log(`   ✅ Service linked successfully!`)
        } catch (error) {
          console.error(`   ❌ Error linking service:`, error)
        }
      } else {
        console.log(`   ⚠️ No exact price match found for QAR ${apt.totalPrice}`)
        console.log(`   Closest services:`)
        
        // Find closest services by price
        const sortedByPriceDiff = allServices
          .map(svc => ({
            ...svc,
            priceDiff: Math.abs(parseFloat(svc.price.toString()) - parseFloat(apt.totalPrice.toString()))
          }))
          .sort((a, b) => a.priceDiff - b.priceDiff)
          .slice(0, 3)

        sortedByPriceDiff.forEach((svc, index) => {
          console.log(`     ${index + 1}. ${svc.name}: QAR ${svc.price} (diff: ${svc.priceDiff})`)
        })

        console.log(`   ℹ️ Skipping - manual intervention needed`)
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ Fix complete!')
    console.log('='.repeat(80))

    // Show final summary
    const updatedAppointments = await prisma.appointment.findMany({
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    })

    const stillMissing = updatedAppointments.filter(apt => apt.services.length === 0)
    console.log(`\n📊 Summary:`)
    console.log(`   Total appointments: ${updatedAppointments.length}`)
    console.log(`   With services: ${updatedAppointments.length - stillMissing.length}`)
    console.log(`   Still missing services: ${stillMissing.length}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMissingAppointmentServices()

