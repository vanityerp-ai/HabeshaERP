import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Finding appointment with missing service...')

  // Find the appointment with ID cmht9yt7v000apziduivbucat (Abi Tota, QAR 250)
  const appointment = await prisma.appointment.findUnique({
    where: { id: 'cmht9yt7v000apziduivbucat' },
    include: {
      services: {
        include: {
          service: true,
        },
      },
      client: {
        include: {
          clientProfile: true,
        },
      },
    },
  })

  if (!appointment) {
    console.log('❌ Appointment not found')
    return
  }

  console.log('\n📋 Appointment Details:')
  console.log(`  ID: ${appointment.id}`)
  console.log(`  Client: ${appointment.client?.clientProfile?.name}`)
  console.log(`  Total Price: ${appointment.totalPrice}`)
  console.log(`  Services: ${appointment.services.length}`)

  if (appointment.services.length > 0) {
    console.log('✅ Appointment already has services linked')
    return
  }

  // Find services with price around QAR 250
  console.log('\n🔍 Finding services with price QAR 250...')
  const services = await prisma.service.findMany({
    where: {
      price: {
        gte: 240,
        lte: 260,
      },
    },
  })

  console.log(`\n📋 Found ${services.length} services with price around QAR 250:`)
  services.forEach((service, index) => {
    console.log(`  ${index + 1}. ${service.name} - QAR ${service.price} (${service.duration} min)`)
  })

  if (services.length === 0) {
    console.log('\n❌ No services found with price QAR 250')
    console.log('Please manually check the database to find the correct service')
    return
  }

  // Use the first service found
  const serviceToLink = services[0]
  console.log(`\n✅ Linking service: ${serviceToLink.name} (QAR ${serviceToLink.price})`)

  // Create the AppointmentService record
  await prisma.appointmentService.create({
    data: {
      appointmentId: appointment.id,
      serviceId: serviceToLink.id,
      price: serviceToLink.price,
      duration: serviceToLink.duration,
    },
  })

  console.log('✅ Service linked successfully!')

  // Verify the link
  const updatedAppointment = await prisma.appointment.findUnique({
    where: { id: appointment.id },
    include: {
      services: {
        include: {
          service: true,
        },
      },
    },
  })

  console.log('\n📋 Updated Appointment:')
  console.log(`  Services: ${updatedAppointment?.services.length}`)
  updatedAppointment?.services.forEach((svc, index) => {
    console.log(`    ${index + 1}. ${svc.service?.name} - QAR ${svc.price}`)
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

